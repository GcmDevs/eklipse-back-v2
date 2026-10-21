import { DocumentoOrm } from '@orm/inn/documentos';
import { resolverOrdenRelacionada } from './orden-relacionada';
import { Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { AsociarOrdenControlGastosPayload, CargarFacturaControlGastosPayload } from '@farmacia/control-gastos/application/payloads';
import { BaseSource } from '@common/infrastructure/services';
import { ControlGastoHistorialOrm, ControlGastoOrm } from '@orm/inn/farmacia/control-gastos';
import { deleteFile } from '@common/presentation/helpers';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { ESTADOS_CONTROL_GASTO } from '@ctypes/inn/farmacia/control-gastos';
import { INN_AUTHORITIES } from '@authorities/inventario';

@Injectable()
export class CargarFacturaControlGastoImpl extends BaseSource {
  public async previewOrden(contextCode: string, tipo: number, consecutivo: string) {
    const qr = this.dynamicQR(gcmContextFactory(contextCode as CargarFacturaControlGastosPayload['contextCode']));
    try {
      await qr.connect();
      const orden = await resolverOrdenRelacionada(qr, tipo, consecutivo);
      if (!orden) throw new Error('Indique el tipo y consecutivo de la orden');
      return orden;
    } finally {
      await qr.release();
    }
  }

  public async asociarOrden(payload: AsociarOrdenControlGastosPayload) {
    if (!Number.isInteger(payload.idControlGasto) || payload.idControlGasto <= 0) {
      throw new Error('Indique una solicitud valida');
    }
    const qr = this.dynamicQR(gcmContextFactory(payload.contextCode));
    try {
      await qr.connect();
      await qr.startTransaction();
      const rp = qr.manager.getRepository(ControlGastoOrm);
      const gasto = await rp.findOne({ where: { id: payload.idControlGasto }, lock: { mode: 'pessimistic_write' } });
      if (!gasto) throw new Error('No existe la solicitud');
      if ([ESTADOS_CONTROL_GASTO.RECHAZADO.getCode(), ESTADOS_CONTROL_GASTO.FINALIZADO.getCode()].includes(gasto.estadoCode)) {
        throw new Error('No se puede asociar una orden a una solicitud rechazada o finalizada');
      }
      if (gasto.ordenRelacionadaId) throw new Error('La solicitud ya tiene una orden relacionada');
      const orden = await resolverOrdenRelacionada(qr, payload.ordenRelacionadaTipoCode, payload.ordenRelacionadaConsecutivo);
      if (!orden) throw new Error('Indique el tipo y consecutivo de la orden');
      gasto.ordenRelacionadaId = orden.id;
      await rp.save(gasto);
      await qr.commitTransaction();
      return orden;
    } catch (error) {
      if (qr.isTransactionActive) await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  public async execute(payload: CargarFacturaControlGastosPayload) {
    const ctx = gcmContextFactory(payload.contextCode);

    // const userHasPermissions = await this.hasAnyAuthority([
    //   INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR,
    // ]);

    // if (!userHasPermissions) {
    //   throw new Error('No tiene permisos para realizar esta acción');
    // }

    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const controlGastoRp = qr.manager.getRepository(ControlGastoOrm);
      const historialRp = qr.manager.getRepository(ControlGastoHistorialOrm);

      // let controlGasto = new ControlGastoOrm();

      // if (payload.idControlGasto) {
      const controlGasto = await controlGastoRp.findOne({
        where: { id: payload.idControlGasto },
      });
      // } else {
      //   controlGasto = await controlGastoRp.findOne({
      //     where: { ordenDespachoId: payload.suministroPacienteId },
      //   });
      // }

      if (!controlGasto) {
        throw new Error(
          'No existe reporte de control de gasto que pertenezca al suministro de paciente con este id'
        );
      }

      if (controlGasto.estadoCode === ESTADOS_CONTROL_GASTO.RECHAZADO.getCode()) {
        throw new Error('El control de gastos fue rechazado');
      }

      if (controlGasto.estadoCode === ESTADOS_CONTROL_GASTO.FINALIZADO.getCode()) {
        throw new Error('El control de gastos ya fue conciliado');
      }
      if (!controlGasto.ordenRelacionadaId) {
        throw new Error('Debe asociar una orden de compra o servicio antes de subir la factura');
      }
      const documento = await qr.manager.getRepository(DocumentoOrm).findOne({ where: { id: controlGasto.ordenRelacionadaId } });
      if (!documento || ![0, 19].includes(documento.tipoCode)) {
        throw new Error('La orden relacionada no esta disponible para visualizar');
      }

      const anteriorFechaFactura = controlGasto.fechaUltimaFactura;
      const anteriorEstadoCode = controlGasto.estadoCode;

      controlGasto.fechaUltimaFactura = new Date();
      controlGasto.factura1Link
        ? controlGasto.estadoCode
        : (controlGasto.estadoCode = ESTADOS_CONTROL_GASTO.EN_TRAMITE.getCode());
      if (controlGasto.factura1Link) {
        if (controlGasto.estadoCode !== ESTADOS_CONTROL_GASTO.PRODU_FACT.getCode()) {
          throw new Error(
            'No se puede agregar una nueva factura ya que el solicitante indicó que no hacen falta productos'
          );
        }
      }

      if (!controlGasto.factura1Link) controlGasto.factura1Link = payload.facturaFileName;
      else if (!controlGasto.factura2Link) controlGasto.factura2Link = payload.facturaFileName;
      else if (!controlGasto.factura3Link) controlGasto.factura3Link = payload.facturaFileName;
      else {
        controlGasto.fechaUltimaFactura = anteriorFechaFactura;
        controlGasto.estadoCode = anteriorEstadoCode;
        throw new Error('Solo se permiten 3 intentos');
      }

      if (controlGasto.estadoCode === ESTADOS_CONTROL_GASTO.PRODU_FACT.getCode()) {
        controlGasto.estadoCode = ESTADOS_CONTROL_GASTO.EN_TRAMITE.getCode();
      }

      const now = new Date();
      const historial = new ControlGastoHistorialOrm();
      historial.controlGastoId = controlGasto.id;
      historial.estadoCode = controlGasto.estadoCode;
      historial.fechaCambio = now;
      historial.usuarioId = this.auth.id;
      if (!controlGasto.factura1Link) {
        historial.facturaLink = payload.facturaFileName;
      } else if (!controlGasto.factura2Link) {
        historial.facturaLink = payload.facturaFileName;
      } else {
        historial.facturaLink = payload.facturaFileName;
      }
      await historialRp.save(historial);

      await controlGastoRp.save(controlGasto);

      await qr.commitTransaction();

      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      if (payload.facturaFileName) {
        deleteFile(`${FILE_LOCATIONS.inn.fmc.controlGastos.facturas}/${payload.facturaFileName}`);
      }
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
