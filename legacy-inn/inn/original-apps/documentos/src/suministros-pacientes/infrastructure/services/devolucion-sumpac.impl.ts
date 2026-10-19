import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { DevolucionSumPacDto } from '../../presentation/dtos';
import { DetalleSuministroPacienteOrm, DocumentoOrm } from '@inn/orm/inn';
import { TIPOS_DOCUMENTO } from '@inn/ek-types/inn/documentos';
import { In } from 'typeorm';
import { DetalleDevSumOrm, DevolucionSumPacOrm } from '../orm/devolucion-tradicional';

@Injectable()
export class DevolucionSumPacImpl extends BaseSource {
  public async create(payload: DevolucionSumPacDto): Promise<DevolucionSumPacOrm> {
    const { documentoId, motivoCode } = payload;

    const tempDevSumPacRp = this.conn.getRepository(DevolucionSumPacOrm);
    const existDevWithSameId = await tempDevSumPacRp.findOne({ where: { documentoId } });
    if (existDevWithSameId) throw new Error('Ya existe una devolución asociada a este documento');

    const tempDocumentoRp = this.conn.getRepository(DocumentoOrm);
    const existDocumento = await tempDocumentoRp.findOne({
      where: { id: documentoId, tipoCode: TIPOS_DOCUMENTO.suministroPaciente.getCode() },
    });
    if (!existDocumento) throw new Error('El documento que buscas no existe');

    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const detSumPacRp = this.qr.manager.getRepository(DetalleSuministroPacienteOrm);
      const devSumPacRp = this.qr.manager.getRepository(DevolucionSumPacOrm);
      const reservaSumPacRp = this.qr.manager.getRepository(DetalleDevSumOrm);

      const suministrosIds = payload.detalle.map(r => r.suministroId);

      const suministros = await detSumPacRp.find({
        where: { id: In(suministrosIds) },
        relations: ['producto', 'lote'],
      });

      if (suministros.length != suministrosIds.length) {
        throw new Error('No todos los suministros existen');
      }

      const newDevSumPac = new DevolucionSumPacOrm();
      newDevSumPac.creadoPorId = this.auth.user.id;
      newDevSumPac.documentoId = documentoId;
      newDevSumPac.motivoCode = motivoCode;
      const savedDevSumPac = await devSumPacRp.save(newDevSumPac);

      const reservas: DetalleDevSumOrm[] = [];

      suministros.forEach(sum => {
        const sumReservado = payload.detalle.filter(el => el.suministroId === sum.id)[0];
        const resSumPac = new DetalleDevSumOrm();
        resSumPac.devolucionId = savedDevSumPac.id;
        resSumPac.suministroId = sum.id;
        resSumPac.estadoCode = sumReservado.estadoCode;
        reservas.push(resSumPac);
      });

      const reservasStored = await reservaSumPacRp.save(reservas);

      reservasStored.map(rs => {
        delete rs.devolucionId;
      });

      await this.qr.commitTransaction();

      delete savedDevSumPac.creadoPorId;
      delete savedDevSumPac.documentoId;
      delete savedDevSumPac.motivoCode;

      savedDevSumPac.detalle = reservasStored;

      return savedDevSumPac;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
