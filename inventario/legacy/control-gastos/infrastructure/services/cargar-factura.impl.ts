import { resolverOrdenRelacionada } from './orden-relacionada';
import { Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { CargarFacturaControlGastosPayload } from '@inn/lgc/cgt/application/payloads/control-gastos.payloads';
import { BaseSource } from '@common/infrastructure/services';
import { ControlGastoHistorialOrm } from '@inn/lgc/cgt/orm/inn/farmacia/control-gastos/historial-control-gasto.orm';
import { ControlGastoOrm } from '@inn/lgc/cgt/orm/inn/farmacia/control-gastos/control-gasto.orm';
import { deleteFile } from '@common/presentation/helpers';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { ESTADOS_CONTROL_GASTO } from '@inn/lgc/cgt/types/inn/farmacia/control-gastos/estado-control-gasto.type';
import { mapOrdenesControlGasto } from './ordenes-control-gasto.mapper';

@Injectable()
export class CargarFacturaControlGastoImpl extends BaseSource {
  public async previewOrden(contextCode: string, tipo: number, consecutivo: string) {
    const qr = this.dynamicQR(
      gcmContextFactory(contextCode as CargarFacturaControlGastosPayload['contextCode'])
    );
    try {
      await qr.connect();
      const orden = await resolverOrdenRelacionada(tipo, consecutivo);
      if (!orden) throw new Error('Indique el tipo y consecutivo de la orden');
      return orden;
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

      if (!Number.isInteger(payload.idControlGasto) || payload.idControlGasto <= 0) {
        throw new Error('Indique una solicitud válida');
      }

      const controlGastoRp = qr.manager.getRepository(ControlGastoOrm);
      const historialRp = qr.manager.getRepository(ControlGastoHistorialOrm);

      // let controlGasto = new ControlGastoOrm();

      // if (payload.idControlGasto) {
      const controlGasto = await controlGastoRp.findOne({
        where: { id: payload.idControlGasto },
        relations: ['ordenRelacionada', 'archivos', 'archivos.documento'],
        lock: { mode: 'pessimistic_write' },
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
      if (controlGasto.estadoCode === ESTADOS_CONTROL_GASTO.INICIADO.getCode()) {
        throw new Error('Debe finalizar la carga de órdenes antes de subir la factura');
      }
      if (!mapOrdenesControlGasto(controlGasto).some(orden => !orden.rechazadoAt)) {
        throw new Error('Debe asociar una orden de compra o servicio antes de subir la factura');
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
    } catch (error: any) {
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
