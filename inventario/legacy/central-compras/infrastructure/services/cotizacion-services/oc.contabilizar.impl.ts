import { IsNull, Not, QueryRunner } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { ContabilizarOrdenCompraDto } from '@inn/lgc/ctc/presentation/dtos';
import { VERIFICAR_VALORES } from '@inn/lgc/ctc/application/constants';
import { FetchPagoCXPI, fetchPagosCXPQr } from '../../queries';
import { gcmContextFactory } from '@common/domain/types';
import { CentralComprasSource } from '../../base';
import {
  CotizacionOrm,
  DetalleCuentaxPagarOrm,
  PagoOrm,
  SolicitudOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';

@Injectable()
export class ContabilizarOrdenCompraImpl extends CentralComprasSource {
  public async comprobanteContable(payload: ContabilizarOrdenCompraDto) {
    const ctx = gcmContextFactory(payload.contextCode);
    this._validarPorcentajes(payload.reteIVA, 'reteIVA');
    this._validarPorcentajes(payload.retefuente, 'retefuente');
    this._validarPorcentajes(payload.reteica, 'reteica');
    if (payload.contextCode !== this.auth.context.getCode()) {
      throw new Error(`La solicitud debe ser contabilizada en ${ctx.getForHumans()}`);
    }
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();
      const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);
      const detalleCuentaxPagarRp = qr.manager.getRepository(DetalleCuentaxPagarOrm);
      const pagoRp = qr.manager.getRepository(PagoOrm);

      const cotizacion = await cotizacionRp.findOne({
        where: { id: payload.cotizacionId },
        relations: ['detalle', 'detalle.item'],
      });

      if (!cotizacion) throw new Error('No existe esta cotización');

      const solicitud = await solicitudRp.findOne({ where: { id: cotizacion.solicitudId } });

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

      const cuentaxPagar: { id: number; totalAPagar: number }[] = await qr.manager.query(
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

      if (VERIFICAR_VALORES) {
        if (pago.valorDescuento > pago.valor) throw new Error('El descuento es superior al pago');
        if (pago.valorDescuento < 0) throw new Error('El descuento no puede ser menor a 0');
      }

      const valorAPagarCuota =
        (valorSubtotalCompleto / 100) * totPorcFin + valorIVACompleto - payload.valorDescuento;

      if (!cuentaxPagar.length) {
        throw new Error(`No existe un comprobante contable con este consecutivo`);
      }

      const valorCxp: { detNetoAPagar: number }[] = [
        { detNetoAPagar: cuentaxPagar[0].totalAPagar },
      ];

      if (VERIFICAR_VALORES) {
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
              `El valor a pagar (${Intl.NumberFormat('en-US').format(
                +pago.valor.toFixed(2)
              )}) difiere
            demasiado del valor del comprobante contable (${Intl.NumberFormat('en-US').format(
              +valorCxp[0].detNetoAPagar.toFixed(2)
            )}), el valor max. de redondeo es $100`
            );
          }
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

      await this.createCambioEstado(qr, {
        solicitud,
        estado: ESTADOS.SOL_ULTIMOS_PASOS,
        entidadRelacionadaId: cotizacion.id,
        estadoEspecifico: ESTADOS_ESPECIFICOS.COTI_OC_CONTABILIZADA,
        informacionAdicional: `${kwTO.tipoOrdenAbr} de cot. #${cotizacion.id} contabilizada${
          payload.observaciones ? `. ${payload.observaciones}` : ''
        }`,
      });

      cotizacion.contabilizada = true;
      if (payload.isContabilizacionUnica) cotizacion.requiereUnicaContabilizacion = true;

      await cotizacionRp.save(cotizacion);

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async cuentaXPagar(payload: ContabilizarOrdenCompraDto) {
    const ctx = gcmContextFactory(payload.contextCode);
    this._validarPorcentajes(payload.reteIVA, 'reteIVA');
    this._validarPorcentajes(payload.retefuente, 'retefuente');
    this._validarPorcentajes(payload.reteica, 'reteica');
    if (payload.contextCode !== this.auth.context.getCode()) {
      throw new Error(`La solicitud debe ser contabilizada en ${ctx.getForHumans()}`);
    }
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();
      const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);
      const detalleCuentaxPagarRp = qr.manager.getRepository(DetalleCuentaxPagarOrm);
      const pagoRp = qr.manager.getRepository(PagoOrm);

      const cotizacion = await cotizacionRp.findOne({
        where: { id: payload.cotizacionId },
        relations: ['detalle', 'detalle.item'],
      });

      if (!cotizacion) throw new Error('No existe esta cotización');
      if (!cotizacion.cotDocumentoId) throw new Error(`Esta cotización no tiene ninguna OC/OS`);

      const solicitud = await solicitudRp.findOne({ where: { id: cotizacion.solicitudId } });

      if (solicitud.wasRejected()) throw new Error('Esta solicitud ya fue rechazada');

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      const detalle = await this._fetchDetalleCXP(qr, payload.consecutivo);

      const pagoActual = await pagoRp.findOne({
        where: {
          cotizacionId: cotizacion.id,
          cotDocumentoId: cotizacion.cotDocumentoId,
          estadoAlPagarId: IsNull(),
          fechaProgramacion: Not(IsNull()),
        },
        order: { id: 'ASC' },
      });

      let valorSubtotal = 0;
      let valorIVA = 0;
      let valorSubtotalCompleto = 0;
      let valorIVACompleto = 0;

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

      valorSubtotal = (valorSubtotal / 100) * pagoActual.porcentaje;
      valorIVA = (valorIVA / 100) * pagoActual.porcentaje;

      const totPorcIVA = 100 - payload.reteIVA;
      const totPorcFin = 100 - (payload.retefuente + payload.reteica);

      const valTotRetenido = (valorSubtotal / 100) * totPorcFin;
      const valIVARetenido = (valorIVA / 100) * totPorcIVA;

      pagoActual.valor = valTotRetenido + valIVARetenido - payload.valorDescuento;
      pagoActual.valorDescuento = payload.valorDescuento;

      if (VERIFICAR_VALORES) {
        if (pagoActual.valorDescuento > pagoActual.valor)
          throw new Error('El descuento es superior al pago');
        if (pagoActual.valorDescuento < 0) throw new Error('El descuento no puede ser menor a 0');
      }

      const valorAPagarCuota =
        (valorSubtotalCompleto / 100) * totPorcFin + valorIVACompleto - payload.valorDescuento;

      if (VERIFICAR_VALORES) {
        if (payload.isContabilizacionUnica) {
          if (
            detalle.valorAPagar < valorAPagarCuota - 100 ||
            detalle.valorAPagar > valorAPagarCuota + 100
          ) {
            throw new Error(
              `El valor a pagar (${Intl.NumberFormat('en-US').format(
                +valorAPagarCuota.toFixed(2)
              )}) difiere demasiado del valor de la CxP (${Intl.NumberFormat('en-US').format(
                +detalle.valorAPagar.toFixed(2)
              )}), el valor max. de redondeo es $100`
            );
          }
        } else {
          if (
            detalle.valorAPagar < pagoActual.valor - 100 ||
            detalle.valorAPagar > pagoActual.valor + 100
          ) {
            throw new Error(
              `El valor a pagar (${Intl.NumberFormat('en-US').format(
                +pagoActual.valor.toFixed(2)
              )}) difiere
            demasiado del valor de la CxP (${Intl.NumberFormat('en-US').format(
              +detalle.valorAPagar.toFixed(2)
            )}), el valor max. de redondeo es $100`
            );
          }
        }
      }

      const newDCxP = new DetalleCuentaxPagarOrm();
      newDCxP.cotizacionId = cotizacion.id;
      newDCxP.cuentaxPagarId = detalle.CxPId;
      newDCxP.createdAt = new Date();
      newDCxP.retefuente = payload.retefuente;
      newDCxP.reteica = payload.reteica;
      newDCxP.reteIVA = payload.reteIVA;

      const dCxPStored = await detalleCuentaxPagarRp.save(newDCxP);

      pagoActual.cuentaxPagarId = dCxPStored.id;
      await pagoRp.save(pagoActual);

      await this.createCambioEstado(qr, {
        solicitud,
        estado: ESTADOS.SOL_ULTIMOS_PASOS,
        estadoEspecifico: ESTADOS_ESPECIFICOS.COTI_OC_CONTABILIZADA,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: `${kwTO.tipoOrdenAbr} de cot. #${cotizacion.id} contabilizada${
          payload.observaciones ? `. ${payload.observaciones}` : ''
        }`,
      });

      cotizacion.contabilizada = true;
      if (payload.isContabilizacionUnica) cotizacion.requiereUnicaContabilizacion = true;

      await cotizacionRp.save(cotizacion);

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  private _validarPorcentajes(value: number, alias: string) {
    if (value < 0 || value > 100) {
      throw new Error(`${alias} no puede ser menor a 0% o mayor a 100%`);
    }
  }

  private async _fetchDetalleCXP(qr: QueryRunner, consecutivo: string) {
    const items: FetchPagoCXPI[] = await qr.manager.query(fetchPagosCXPQr(consecutivo));

    if (!items.length) throw new Error('No existe una cuenta x pagar con este consecutivo');

    const debitos = items.filter(c => c.naturaleza === 1);
    const creditos = items.filter(c => c.naturaleza === 2);

    const valorDebitos = debitos.length
      ? debitos.map(e => e.totalAPagar).reduce((a, b) => a + b, 0)
      : 0;

    const valorCreditos = creditos.length
      ? creditos.map(e => e.totalAPagar).reduce((a, b) => a + b, 0)
      : 0;

    const valorAPagar = valorDebitos - valorCreditos;

    return { CxPId: items[0].id, valorAPagar };
  }
}
