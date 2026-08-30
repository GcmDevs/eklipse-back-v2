import { BadRequestException, Injectable } from '@nestjs/common';
import { Like } from 'typeorm';
import { GCM_CONTEXTS } from '@common/domain/types';
import { BaseSource, switchConn } from '@common/infrastructure/services';
import { CreateSugerenciaDto } from '@inn/lgc/rct/presentation/dtos';
import { SugerenciaCode } from '@inn/lgc/rct/types/inn/farmacia/recepcion-tecnica';
import { SRDCentroOrm, SRDRCTSugerenciaOrm } from '@inn/lgc/rct/orm/shared-bd';

@Injectable()
export class RCTSugerenciasImpl extends BaseSource {
  public async create(payload: CreateSugerenciaDto): Promise<SRDRCTSugerenciaOrm> {
    const sharedDbDs = switchConn(GCM_CONTEXTS.EKLIPSE);
    const qr = sharedDbDs.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const sharedDbCentroRp = sharedDbDs.getRepository(SRDCentroOrm);
      const sharedDbCentro = await sharedDbCentroRp.findOne({
        where: { contextCode: this.auth.context.getCode() },
      });

      const sugerenciaRp = qr.manager.getRepository(SRDRCTSugerenciaOrm);

      const { nombre, tipo } = payload;

      let sugerenciaStored = await sugerenciaRp.findOne({ where: { nombre, tipoCode: tipo } });

      if (!sugerenciaStored) {
        const sugerencia = new SRDRCTSugerenciaOrm();
        sugerencia.nombre = payload.nombre;
        sugerencia.tipoCode = payload.tipo;
        sugerencia.usuarioId = this.auth.id;
        sugerencia.centroId = sharedDbCentro.id;

        sugerenciaStored = await sugerenciaRp.save(sugerencia);
      }

      await qr.commitTransaction();
      return sugerenciaStored;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async fetch(keyword: string, tipo: SugerenciaCode) {
    const sharedDbDs = switchConn(GCM_CONTEXTS.EKLIPSE);

    const sugerenciaRp = sharedDbDs.getRepository(SRDRCTSugerenciaOrm);

    const sugerencias = await sugerenciaRp.find({
      where: { nombre: Like(`%${keyword}%`), tipoCode: tipo },
      take: 5,
      select: {
        id: true,
        nombre: true,
        tipoCode: true,
      },
    });

    sugerencias.map(s => {
      s.setTypes();
    });

    return sugerencias;
  }
}
