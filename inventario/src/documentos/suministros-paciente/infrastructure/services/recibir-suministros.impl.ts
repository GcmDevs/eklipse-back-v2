import { cloneDeep } from 'lodash';
import { BaseSource } from '@common/infrastructure/services';
import { RSAServices } from '@common/application/services';
import { BadRequestException } from '@nestjs/common';
import { findSuministrosByIdQuery, recibirSuministroQuery } from '../queries';
import { SumPacDto, SumPacRecibidoPayload } from '../../presentation/dtos';
import { SuministroPacienteRecibidoOrm } from '@inn/orm/inn/documentos';

export class RecibirSuministrosImpl extends BaseSource {
  public async execute(payload: SumPacRecibidoPayload[], despachadorId: string): Promise<boolean> {
    const arrWithIds = cloneDeep(payload).map(item => item.id);
    const suministros: SumPacDto[] = await this.conn.query(findSuministrosByIdQuery(arrWithIds));

    let ordenSuministrosId = 0;

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

      const despachadorIdDecoded = RSAServices.decryptId(despachadorId);

      for (let index = 0; index < suministros.length; index++) {
        const el = suministros[index];
        await this.qr.query(
          recibirSuministroQuery(el.id, el.cantidadRecibida, despachadorIdDecoded)
        );
      }

      const rp = this.qr.manager.getRepository(SuministroPacienteRecibidoOrm);

      const mod = await rp.findOne({ where: { ordenSuministrosId } });

      if (!mod) throw new Error('No se encontró la orden de suministro lista para entrega');

      mod.usuarioEntregaId = this.auth.id;
      mod.usuarioRecibeId = despachadorIdDecoded;
      mod.fechaEntrega = new Date();

      await rp.save(mod);

      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
