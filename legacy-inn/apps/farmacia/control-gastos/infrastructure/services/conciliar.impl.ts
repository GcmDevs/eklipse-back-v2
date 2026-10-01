import { Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { GenerateReporteControlGastosPayload } from '@farmacia/control-gastos/application/payloads';
import {
  ESTADOS_AL_CONCILIAR_CODES,
  ESTADOS_CONTROL_GASTO,
} from '@ctypes/inn/farmacia/control-gastos';
import { BaseSource } from '@common/infrastructure/services';
import {
  ControlGastoHistorialOrm,
  ControlGastoOrm,
  DetalleControlGastoOrm,
} from '@orm/inn/farmacia/control-gastos';

@Injectable()
export class ConciliarControlGastoImpl extends BaseSource {
  public async execute(payload: GenerateReporteControlGastosPayload) {
    if (ESTADOS_AL_CONCILIAR_CODES.indexOf(payload.estadoCode) < 0) {
      throw new Error('El estado no es valido');
    }

    if (!Number.isInteger(payload.idControlGasto) || payload.idControlGasto <= 0) {
      throw new Error('Debe enviar un id de control de gastos valido');
    }

    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const controlGastoRp = qr.manager.getRepository(ControlGastoOrm);
      const detalleControlGastoRp = qr.manager.getRepository(DetalleControlGastoOrm);
      const historialRp = qr.manager.getRepository(ControlGastoHistorialOrm);

      const controlGasto = await controlGastoRp.findOne({
        where: { id: payload.idControlGasto },
        relations: ['detalle'],
      });

      if (!controlGasto) {
        throw new Error('No existe reporte de control de gastos con este id');
      }

      if (controlGasto.estadoCode === ESTADOS_CONTROL_GASTO.RECHAZADO.getCode()) {
        throw new Error('El control de gastos fue rechazado');
      }

      if (payload.detalle) {
        let itemsCoinciden = 0;

        controlGasto.detalle.forEach(d => {
          const dt = payload.detalle.find(
            pd => pd.itemReporteControlGastoId === d.id && pd.itemSuministroPacienteId === d.itemId
          );

          if (dt) {
            itemsCoinciden++;
            d.isConciliado = dt.isConciliado;
          }
        });

        if (itemsCoinciden !== payload.detalle.length) {
          throw new Error('La cantidad de items no coincide');
        }

        await detalleControlGastoRp.save(controlGasto.detalle);
      }

      controlGasto.estadoCode = payload.estadoCode;
      await controlGastoRp.save(controlGasto);

      const historial = new ControlGastoHistorialOrm();
      historial.controlGastoId = controlGasto.id;
      historial.estadoCode = payload.estadoCode;
      historial.fechaCambio = new Date();
      historial.usuarioId = this.auth.id;
      if (payload.observacion) {
        historial.observacion = payload.observacion;
      }

      await historialRp.save(historial);

      await qr.commitTransaction();

      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
