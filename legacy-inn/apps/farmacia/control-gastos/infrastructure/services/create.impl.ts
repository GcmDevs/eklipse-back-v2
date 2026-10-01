import { Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import {
  ControlGastoHistorialOrm,
  ControlGastoOrm,
  DetalleControlGastoOrm,
} from '@orm/inn/farmacia/control-gastos';
import { OrdenDespachoOrm, TrasladoProductoOrm } from '@orm/inn/documentos';
import { ESTADOS_CONTROL_GASTO } from '@ctypes/inn/farmacia/control-gastos';
import { CreateControlGastosPayload } from '@farmacia/control-gastos/application/payloads';
import { deleteFile } from '@common/presentation/helpers';
import { FILE_LOCATIONS } from '@common/application/constants';
import { AREA } from '@farmacia/control-gastos/domain/types';
import { Repository } from 'typeorm';

@Injectable()
export class CreateControlGastoImpl extends BaseSource {
  public async execute(body: CreateControlGastosPayload) {
    const ctx = gcmContextFactory(body.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();

      const ordenDespachoRp = qr.manager.getRepository(OrdenDespachoOrm);
      const trasladoProductoRp = qr.manager.getRepository(TrasladoProductoOrm);
      const controlGastoRp = qr.manager.getRepository(ControlGastoOrm);
      const detalleControlGastoRp = qr.manager.getRepository(DetalleControlGastoOrm);
      const historialRp = qr.manager.getRepository(ControlGastoHistorialOrm);

      const isMaos = body.area === AREA.MAOS.getCode();
      const now = new Date();
      let controlGastoStored = new ControlGastoOrm();
      let detalleOrigenIds: number[] = [];

      if (body.trasladoProductoId) {
        const trasladoProducto = await trasladoProductoRp.findOne({
          where: { id: body.trasladoProductoId },
          relations: ['trasladoProductoDetalle'],
        });
        if (!trasladoProducto) throw new Error('No existe traslado de producto con este id');

        const existTrasladoProducto = await controlGastoRp.findOne({
          where: { trasladoProductoId: body.trasladoProductoId },
        });
        if (existTrasladoProducto) {
          throw new Error('Ya existe un control de gastos con este traslado de producto');
        }

        controlGastoStored = await solicitudTrasladoProductoFn(
          body,
          this.auth.id,
          controlGastoRp,
          historialRp
        );
        detalleOrigenIds = trasladoProducto.trasladoProductoDetalle.map(detalle => detalle.id);
      } else if (isMaos) {
        controlGastoStored = await solicitudMaosFn(body, this.auth.id, controlGastoRp, historialRp);
      } else {
        if (!body.suministroPacienteId)
          throw new Error('Debe enviar la orden de despacho si el área no es MAOS');

        const ordenDespacho = await ordenDespachoRp.findOne({
          where: { id: body.suministroPacienteId },
          relations: ['detalle'],
        });
        if (!ordenDespacho) throw new Error('No existe orden de despacho con este id');

        const existOrdenDespacho = await controlGastoRp.findOne({
          where: { ordenDespachoId: body.suministroPacienteId },
          relations: ['detalle'],
        });
        if (existOrdenDespacho) {
          throw new Error('Ya existe un suministro de paciente con este id');
        }

        detalleOrigenIds = ordenDespacho.detalle.map(detalle => detalle.id);

        const newControlGasto = new ControlGastoOrm();
        newControlGasto.estadoCode = ESTADOS_CONTROL_GASTO.PENDIENTE.getCode();
        newControlGasto.fechaCreacion = new Date();
        newControlGasto.fechaProcedimiento = new Date(`${body.fechaProcedimiento}:00:00`);
        newControlGasto.area = body.area;
        newControlGasto.creadoPorId = this.auth.id;
        newControlGasto.documentoAdjuntoLink = body.documentoFileName;
        newControlGasto.sedeId = body.sedeId;

        newControlGasto.ordenDespachoId = body.suministroPacienteId;

        controlGastoStored = await controlGastoRp.save(newControlGasto);

        const historial = new ControlGastoHistorialOrm();
        historial.controlGastoId = controlGastoStored.id;
        historial.estadoCode = ESTADOS_CONTROL_GASTO.PENDIENTE.getCode();
        historial.fechaCambio = now;
        historial.usuarioId = this.auth.id;
        historial.facturaLink = body.documentoFileName;

        await historialRp.save(historial);
      }
      let detalleControlGastoStored = [];
      if (body.trasladoProductoId || !isMaos) {
        const detalleControlGasto: DetalleControlGastoOrm[] = detalleOrigenIds.map(itemId => {
          const det = new DetalleControlGastoOrm();
          det.controlGastoId = controlGastoStored.id;
          det.itemId = itemId;
          return det;
        });

        detalleControlGastoStored = await detalleControlGastoRp.save(detalleControlGasto);
      }

      await qr.commitTransaction();

      return {
        id: controlGastoStored.id,
        detalle: detalleControlGastoStored.map(d => ({
          id: d.id,
          itemId: d.itemId,
        })),
      };
    } catch (error) {
      await qr.rollbackTransaction();
      if (body.documentoFileName) {
        deleteFile(
          `${FILE_LOCATIONS.inn.fmc.controlGastos.documentoAdjunto}/${body.documentoFileName}`
        );
      }
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}

const solicitudMaosFn = async (
  body: CreateControlGastosPayload,
  idUsuario: number,
  controlGastoRp: Repository<ControlGastoOrm>,
  historialRp: Repository<ControlGastoHistorialOrm>
) => {
  if (!body.ingreso) throw new Error('Debe enviar el ingreso del paciente');

  const now = new Date();
  const newControlGasto = new ControlGastoOrm();
  newControlGasto.estadoCode = ESTADOS_CONTROL_GASTO.INICIADO.getCode();
  newControlGasto.fechaCreacion = new Date();
  newControlGasto.fechaProcedimiento = new Date(`${body.fechaProcedimiento}:00:00`);
  newControlGasto.area = body.area;
  newControlGasto.creadoPorId = idUsuario;
  newControlGasto.sedeId = body.sedeId;

  newControlGasto.ingreso = body.ingreso;

  const controlGastoStored = await controlGastoRp.save(newControlGasto);

  const historial = new ControlGastoHistorialOrm();
  historial.controlGastoId = controlGastoStored.id;
  historial.estadoCode = ESTADOS_CONTROL_GASTO.INICIADO.getCode();
  historial.fechaCambio = now;
  historial.usuarioId = idUsuario;
  historial.facturaLink = body.documentoFileName;

  await historialRp.save(historial);

  return newControlGasto;
};

const solicitudTrasladoProductoFn = async (
  body: CreateControlGastosPayload,
  idUsuario: number,
  controlGastoRp: Repository<ControlGastoOrm>,
  historialRp: Repository<ControlGastoHistorialOrm>
) => {
  if (!body.trasladoProductoId) throw new Error('Debe enviar el traslado de producto');

  const now = new Date();
  const newControlGasto = new ControlGastoOrm();
  newControlGasto.estadoCode = ESTADOS_CONTROL_GASTO.PENDIENTE.getCode();
  newControlGasto.fechaCreacion = new Date();
  newControlGasto.fechaProcedimiento = new Date(`${body.fechaProcedimiento}:00:00`);
  newControlGasto.area = body.area;
  newControlGasto.creadoPorId = idUsuario;
  newControlGasto.sedeId = body.sedeId;
  newControlGasto.documentoAdjuntoLink = body.documentoFileName;
  newControlGasto.trasladoProductoId = body.trasladoProductoId;

  const controlGastoStored = await controlGastoRp.save(newControlGasto);

  const historial = new ControlGastoHistorialOrm();
  historial.controlGastoId = controlGastoStored.id;
  historial.estadoCode = ESTADOS_CONTROL_GASTO.PENDIENTE.getCode();
  historial.fechaCambio = now;
  historial.usuarioId = idUsuario;
  historial.facturaLink = body.documentoFileName;

  await historialRp.save(historial);

  return newControlGasto;
};
