import { BaseSource } from '@common/infrastructure/services';
import { SuministroPacienteRecibidoOrm } from '@inn/orm/inn/documentos';
import { SumPacDto, SumPacRecibidoPayload } from '../../presentation/dtos';
import { findSuministrosByIdQuery, recibirSuministroQuery } from '../queries';
import { cloneDeep } from 'lodash';

export class SuministrosListosParaEntregaImpl extends BaseSource {
  public async execute(
    ordenSuministrosId: number,
    payload: SumPacRecibidoPayload[]
  ): Promise<boolean> {
    const arrWithIds = cloneDeep(payload).map(item => item.id);
    const suministros: SumPacDto[] = await this.conn.query(findSuministrosByIdQuery(arrWithIds));

    suministros.map((suministro, i) => {
      if (!i) ordenSuministrosId = suministro.ordenId;
      const isSameOrden = suministro.ordenId !== ordenSuministrosId;
      if (isSameOrden) throw new Error('No todos los items pertenecen a la misma orden');
      if (suministro.recibidoPor) throw new Error('Uno de los items fue recibido previamente');
      const sumRecArr = payload.filter(sumRec => sumRec.id === suministro.id);
      if (sumRecArr.length) suministro.cantidadRecibida = sumRecArr[0].cantidad;
      if ([null, undefined].indexOf(suministro.cantidadRecibida) >= 0) {
        throw new Error('Uno los items no existe en esta orden');
      } else {
        if (suministro.cantidadRecibida < 0 || suministro.cantidadRecibida > suministro.cantidad) {
          throw new Error('Uno los items tiene una cantidad recibida invalida');
        }
      }
    });

    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const rp = this.qr.manager.getRepository(SuministroPacienteRecibidoOrm);

      const despachadorIdDecoded = this.auth.id;

      for (let index = 0; index < suministros.length; index++) {
        const el = suministros[index];
        await this.qr.query(
          recibirSuministroQuery(el.id, el.cantidadRecibida, despachadorIdDecoded)
        );
      }

      const exist = await rp.findOne({ where: { ordenSuministrosId } });

      if (exist) {
        throw new Error('Ya se ha registrado esta orden de suministro como lista para entrega');
      }

      const newMod = new SuministroPacienteRecibidoOrm();
      newMod.ordenSuministrosId = ordenSuministrosId;
      newMod.usuarioEntregaId = this.auth.id;

      await rp.save(newMod);

      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
