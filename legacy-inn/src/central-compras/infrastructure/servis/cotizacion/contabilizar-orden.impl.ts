import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CotizacionOrm,
  DetalleCuentaxPagarOrm,
  PagoOrm,
  SolicitudOrm,
} from '@orm/inn/central-compras';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { OldContabilizarOrdenDto } from '@inn/central-compras/presentation/dtos';
import { gcmContextFactory } from '@common/domain/types';
import { CentralComprasSource } from '../../base';
import { IsNull, Not } from 'typeorm';

@Injectable()
export class ContabilizarOrdenImpl extends CentralComprasSource {
  public async comprobanteContable(payload: OldContabilizarOrdenDto) {
    if (payload.reteIVA < 0 || payload.reteIVA > 100) {
      throw new Error('El reteIVA no puede ser menor a 0% o mayor a 100%');
    }
    if (payload.retefuente < 0 || payload.retefuente > 100) {
      throw new Error('El retefuente no puede ser menor a 0% o mayor a 100%');
    }
    if (payload.reteica < 0 || payload.reteica > 100) {
      throw new Error('El reteica no puede ser menor a 0% o mayor a 100%');
    }

    if (payload.context !== this.auth.context.getCode()) {
      throw new BadRequestException(
        `La solicitud debe ser contabilizada en ${gcmContextFactory(
          payload.context
        ).getForHumans()}`
      );
    }

    const ds = this.dynamicConn(gcmContextFactory(payload.context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const detalleCuentaxPagarRp = localQr.manager.getRepository(DetalleCuentaxPagarOrm);
      const pagoRp = localQr.manager.getRepository(PagoOrm);

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: payload.cotizacionId },
        relations: ['detalle', 'detalle.item'],
      });

      const solicitud = await solicitudRp.findOneOrFail({ where: { id: cotizacion.solicitudId } });

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      if (solicitud.wasRejected()) {
        throw new Error('Esta solicitud ya fue rechazada');
      }

      if (!cotizacion.cotDocumentoId) {
        throw new Error(`Esta cotización no tiene ninguna orden de ${kwTO.tipoOrden} agregada`);
      }

      const actualYear = payload.codigoComprobanteContableAnio
        ? payload.codigoComprobanteContableAnio
        : `${new Date().getFullYear()}`;

      const cuentaxPagar: { id: number; totalAPagar: number }[] = await localQr.manager.query(
        `SELECT T.OID id, D.CMMVALDEB totalAPagar FROM CTNCOM${actualYear} T
        INNER JOIN CTNCOMD${actualYear} D ON D.CTNCOMCONC = T.OID
        WHERE COMCODIGO = @0 AND D.CMMVALDEB > 0`,
        [payload.codigoComprobanteContable]
      );

      const pago = await pagoRp.findOne({
        where: {
          cotizacionId: cotizacion.id,
          cotDocumentoId: cotizacion.cotDocumentoId,
          estadoAlPagarId: IsNull(),
          fechaProgramacion: Not(IsNull()),
        },
        order: { id: 'ASC' },
      });

      let valorSubtotal = 0,
        valorIVA = 0,
        valorSubtotalCompleto = 0,
        valorIVACompleto = 0;

      cotizacion.detalle.forEach(det => {
        if (det.isAprobado) {
          const porcentajeConDescuento = 100 - det.descuento;
          const subTotal = det.valorUnitario * det.item.cantidad;
          const total = (subTotal / 100) * porcentajeConDescuento;
          valorSubtotal += total;
          valorSubtotalCompleto += total;
          if (det.IVA) {
            valorIVA += (total / 100) * det.IVA;
            valorIVACompleto += (total / 100) * det.IVA;
          }
        }
      });

      valorSubtotal = (valorSubtotal / 100) * pago.porcentaje;
      valorIVA = (valorIVA / 100) * pago.porcentaje;

      const totPorcIVA = 100 - payload.reteIVA;
      const totPorcFin = 100 - (payload.retefuente + payload.reteica);

      const valTotRetenido = (valorSubtotal / 100) * totPorcFin;
      const valIVARetenido = (valorIVA / 100) * totPorcIVA;

      pago.valor = valTotRetenido + valIVARetenido - payload.valorDescuento;
      pago.valorDescuento = payload.valorDescuento;

      if (pago.valorDescuento > pago.valor) throw new Error('El descuento es superior al pago');
      if (pago.valorDescuento < 0) throw new Error('El descuento no puede ser menor a 0');

      const valorAPagarCuota =
        (valorSubtotalCompleto / 100) * totPorcFin + valorIVACompleto - payload.valorDescuento;

      if (!cuentaxPagar.length) {
        throw new Error(`No existe una comprobante contable con este consecutivo`);
      }

      const valorCxp: { detNetoAPagar: number }[] = [
        { detNetoAPagar: cuentaxPagar[0].totalAPagar },
      ];

      if (payload.isContabilizacionUnica) {
        if (
          valorCxp[0].detNetoAPagar < valorAPagarCuota - 100 ||
          valorCxp[0].detNetoAPagar > valorAPagarCuota + 100
        ) {
          throw new Error(
            `El valor a pagar (${Intl.NumberFormat('en-US').format(
              +valorAPagarCuota.toFixed(2)
            )}) difiere
            demasiado del valor de la CxP (${Intl.NumberFormat('en-US').format(
              +valorCxp[0].detNetoAPagar.toFixed(2)
            )}), el valor max. de redondeo es $100`
          );
        }
      } else {
        if (
          valorCxp[0].detNetoAPagar < pago.valor - 100 ||
          valorCxp[0].detNetoAPagar > pago.valor + 100
        ) {
          throw new Error(
            `El valor a pagar (${Intl.NumberFormat('en-US').format(+pago.valor.toFixed(2))}) difiere
            demasiado del valor del comprobante contable (${Intl.NumberFormat('en-US').format(
              +valorCxp[0].detNetoAPagar.toFixed(2)
            )}), el valor max. de redondeo es $100`
          );
        }
      }

      const newDCxP = new DetalleCuentaxPagarOrm();
      newDCxP.cotizacionId = cotizacion.id;
      newDCxP.comprobanteContableId = cuentaxPagar[0].id;
      newDCxP.comprobanteContableAnio = actualYear;
      newDCxP.createdAt = new Date();
      newDCxP.retefuente = payload.retefuente;
      newDCxP.reteica = payload.reteica;
      newDCxP.reteIVA = payload.reteIVA;

      const dCxPStored = await detalleCuentaxPagarRp.save(newDCxP);

      pago.cuentaxPagarId = dCxPStored.id;
      await pagoRp.save(pago);

      const estado = await this.createCambioEstadoDeprecated(localQr, {
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.COTI_OC_CONTABILIZADA.getCode(),
        estadoCode: ESTADOS.SOL_ULTIMOS_PASOS.getCode(),
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: `${kwTO.tipoOrdenAbr} de cot. #${cotizacion.id} contabilizada${
          payload.observaciones ? `. ${payload.observaciones}` : ''
        }`,
      });

      cotizacion.contabilizada = true;
      if (payload.isContabilizacionUnica) cotizacion.requiereUnicaContabilizacion = true;

      await cotizacionRp.save(cotizacion);

      await localQr.commitTransaction();

      return { estado, detalleCuentaxPagar: dCxPStored };
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }

  public async cuentaXPagar(payload: OldContabilizarOrdenDto) {
    if (payload.reteIVA < 0 || payload.reteIVA > 100) {
      throw new Error('El reteIVA no puede ser menor a 0% o mayor a 100%');
    }
    if (payload.retefuente < 0 || payload.retefuente > 100) {
      throw new Error('El retefuente no puede ser menor a 0% o mayor a 100%');
    }
    if (payload.reteica < 0 || payload.reteica > 100) {
      throw new Error('El reteica no puede ser menor a 0% o mayor a 100%');
    }

    if (payload.context !== this.auth.context.getCode()) {
      throw new BadRequestException(
        `La solicitud debe ser contabilizada en ${gcmContextFactory(
          payload.context
        ).getForHumans()}`
      );
    }

    const ds = this.dynamicConn(gcmContextFactory(payload.context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const detalleCuentaxPagarRp = localQr.manager.getRepository(DetalleCuentaxPagarOrm);
      const pagoRp = localQr.manager.getRepository(PagoOrm);

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: payload.cotizacionId },
        relations: ['detalle', 'detalle.item'],
      });

      const solicitud = await solicitudRp.findOneOrFail({ where: { id: cotizacion.solicitudId } });

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      if (solicitud.wasRejected()) {
        throw new Error('Esta solicitud ya fue rechazada');
      }

      if (!cotizacion.cotDocumentoId) {
        throw new Error(`Esta cotización no tiene ninguna orden de ${kwTO.tipoOrden} agregada`);
      }

      const cuentaxPagar: { id: number; totalAPagar: number }[] = await localQr.manager.query(
        `SELECT CP.OID id, DTCP.DETVALOR totalAPagar from  PGNCXP CP
        INNER JOIN PGNCXPDETALLE DTCP ON DTCP.PGNCXP= CP.OID
        where CP.CXPDOCUME = @0`,
        [payload.consecutivo]
      );

      const pago = await pagoRp.findOne({
        where: {
          cotizacionId: cotizacion.id,
          cotDocumentoId: cotizacion.cotDocumentoId,
          estadoAlPagarId: IsNull(),
          fechaProgramacion: Not(IsNull()),
        },
        order: { id: 'ASC' },
      });

      let valorSubtotal = 0,
        valorIVA = 0,
        valorSubtotalCompleto = 0,
        valorIVACompleto = 0;

      cotizacion.detalle.forEach(det => {
        if (det.isAprobado) {
          const porcentajeConDescuento = 100 - det.descuento;
          const subTotal = det.valorUnitario * det.item.cantidad;
          const total = (subTotal / 100) * porcentajeConDescuento;
          valorSubtotal += total;
          valorSubtotalCompleto += total;
          if (det.IVA) {
            valorIVA += (total / 100) * det.IVA;
            valorIVACompleto += (total / 100) * det.IVA;
          }
        }
      });

      valorSubtotal = (valorSubtotal / 100) * pago.porcentaje;
      valorIVA = (valorIVA / 100) * pago.porcentaje;

      const totPorcIVA = 100 - payload.reteIVA;
      const totPorcFin = 100 - (payload.retefuente + payload.reteica);

      const valTotRetenido = (valorSubtotal / 100) * totPorcFin;
      const valIVARetenido = (valorIVA / 100) * totPorcIVA;

      pago.valor = valTotRetenido + valIVARetenido - payload.valorDescuento;
      pago.valorDescuento = payload.valorDescuento;

      if (pago.valorDescuento > pago.valor) throw new Error('El descuento es superior al pago');
      if (pago.valorDescuento < 0) throw new Error('El descuento no puede ser menor a 0');

      const valorAPagarCuota =
        (valorSubtotalCompleto / 100) * totPorcFin + valorIVACompleto - payload.valorDescuento;

      if (!cuentaxPagar.length) {
        throw new Error(`No existe una cuenta x pagar con este consecutivo`);
      }

      const valorCxp: { detNetoAPagar: number }[] = await localQr.manager.query(`select
      CP.OID id,
      DTCP.DETVALOR detNetoAPagar
      from PGNCXP CP
      INNER JOIN GENTERCERP P ON P.OID = CP.GENTERCERP
      INNER JOIN PGNCXPDETALLE DTCP ON DTCP.PGNCXP= CP.OID
      where CP.OID = ${cuentaxPagar[0].id}`);

      if (payload.isContabilizacionUnica) {
        if (
          valorCxp[0].detNetoAPagar < valorAPagarCuota - 100 ||
          valorCxp[0].detNetoAPagar > valorAPagarCuota + 100
        ) {
          throw new Error(
            `El valor a pagar (${Intl.NumberFormat('en-US').format(
              +valorAPagarCuota.toFixed(2)
            )}) difiere
            demasiado del valor de la CxP (${Intl.NumberFormat('en-US').format(
              +valorCxp[0].detNetoAPagar.toFixed(2)
            )}), el valor max. de redondeo es $100`
          );
        }
      } else {
        if (
          valorCxp[0].detNetoAPagar < pago.valor - 100 ||
          valorCxp[0].detNetoAPagar > pago.valor + 100
        ) {
          throw new Error(
            `El valor a pagar (${Intl.NumberFormat('en-US').format(+pago.valor.toFixed(2))}) difiere
            demasiado del valor de la CxP (${Intl.NumberFormat('en-US').format(
              +valorCxp[0].detNetoAPagar.toFixed(2)
            )}), el valor max. de redondeo es $100`
          );
        }
      }

      const newDCxP = new DetalleCuentaxPagarOrm();
      newDCxP.cotizacionId = cotizacion.id;
      newDCxP.cuentaxPagarId = cuentaxPagar[0].id;
      newDCxP.createdAt = new Date();
      newDCxP.retefuente = payload.retefuente;
      newDCxP.reteica = payload.reteica;
      newDCxP.reteIVA = payload.reteIVA;

      const dCxPStored = await detalleCuentaxPagarRp.save(newDCxP);

      pago.cuentaxPagarId = dCxPStored.id;
      await pagoRp.save(pago);

      const estado = await this.createCambioEstadoDeprecated(localQr, {
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.COTI_OC_CONTABILIZADA.getCode(),
        estadoCode: ESTADOS.SOL_ULTIMOS_PASOS.getCode(),
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: `${kwTO.tipoOrdenAbr} de cot. #${cotizacion.id} contabilizada${
          payload.observaciones ? `. ${payload.observaciones}` : ''
        }`,
      });

      cotizacion.contabilizada = true;
      if (payload.isContabilizacionUnica) cotizacion.requiereUnicaContabilizacion = true;

      await cotizacionRp.save(cotizacion);

      await localQr.commitTransaction();

      return { estado, detalleCuentaxPagar: dCxPStored };
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }
}
