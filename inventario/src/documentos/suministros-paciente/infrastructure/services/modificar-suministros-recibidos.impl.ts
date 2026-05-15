import { cloneDeep } from 'lodash';
import { BaseSource } from '@common/infrastructure/services';
import { SumPacDto, SumPacModifiRecibiPayload } from '../../presentation/dtos';
import { findSuministrosByIdQuery, recibirSuministroQuery } from '../queries';
import { SuministroPacienteRecibidoOrm } from '@inn/orm/inn/documentos';
import { RSAServices } from '@common/application/services';

export class ModificarSuministrosRecibidosImpl extends BaseSource {
  public async execute(
    payload: SumPacModifiRecibiPayload,
    despachadorId: string
  ): Promise<boolean> {
    const arrWithIds = cloneDeep(payload.suministros).map(item => item.id);

    const suministros: SumPacDto[] = await this.conn.query(findSuministrosByIdQuery(arrWithIds));

    suministros.map(suministro => {
      const isSameOrden = suministro.ordenId !== payload.ordenSuministros;
      if (isSameOrden) throw new Error('No todos los items pertenecen a la misma orden');
      const sumRecArr = payload.suministros.filter(sumRec => sumRec.id === suministro.id);
      if (sumRecArr.length) suministro.cantidadRecibidaModificada = sumRecArr[0].cantidad;
      if ([null, undefined].indexOf(suministro.cantidadRecibidaModificada) >= 0) {
        throw new Error('Este item aun no ha sido recibido');
      }
      if ([null, undefined].indexOf(suministro.cantidadRecibidaModificada) >= 0) {
        throw new Error('Uno los items no existe en esta orden');
      } else {
        if (
          suministro.cantidadRecibidaModificada < suministro.cantidadRecibida ||
          suministro.cantidadRecibidaModificada > suministro.cantidad
        ) {
          throw new Error('Uno los items tiene una cantidad recibida invalida');
        }
      }
    });

    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const despachadorIdDecoded = RSAServices.decryptId(despachadorId);

      const rp = this.qr.manager.getRepository(SuministroPacienteRecibidoOrm);

      const modificacion = await rp.findOne({
        where: { ordenSuministrosId: payload.ordenSuministros },
      });

      if (!modificacion.fechaModificacion) {
        for (let index = 0; index < suministros.length; index++) {
          const el = suministros[index];
          await this.qr.query(
            recibirSuministroQuery(el.id, el.cantidadRecibidaModificada, despachadorIdDecoded)
          );
        }

        modificacion.usuarioModificaId = despachadorIdDecoded;
        modificacion.fechaModificacion = new Date();

        await rp.save(modificacion);

        await this.qr.commitTransaction();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      await this.qr.rollbackTransaction();
    } finally {
      await this.qr.release();
    }
  }
}
