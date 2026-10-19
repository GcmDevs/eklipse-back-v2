import { TipoSugerenciaTypeCode } from '@inn/old/inn/recepcion-tecnica/domain/types';
import { CreateSugerenciaDto } from '@inn/old/inn/recepcion-tecnica/presentation/dtos';
import { BadRequestException, Injectable } from '@nestjs/common';
import { In, Like } from 'typeorm';
import { GcmContexts } from '@inn/old/common/application/constants';
import { ProductoOrm, CentroOSRD, SugerenciaOSRD } from '@inn/old/inn/recepcion-tecnica/orm';
import { BaseSource, switchConn } from '@common/infrastructure/services';
import { GCM_CONTEXTS, gcmContextFactory } from '@common/domain/types';

@Injectable()
export class SugerenciasService extends BaseSource {
  public async create(payload: CreateSugerenciaDto): Promise<SugerenciaOSRD> {
    const sharedDbDs = switchConn(GCM_CONTEXTS.EKLIPSE);
    const qr = sharedDbDs.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const sharedDbCentroRp = sharedDbDs.getRepository(CentroOSRD);
      const sharedDbCentro = await sharedDbCentroRp.findOne({
        where: { contexto: this.auth.context.getCode() },
      });

      const sugerenciaRp = qr.manager.getRepository(SugerenciaOSRD);

      const { nombre, tipo } = payload;

      let sugerenciaStored = await sugerenciaRp.findOne({ where: { nombre, tipo } });

      if (!sugerenciaStored) {
        const sugerencia = new SugerenciaOSRD();
        sugerencia.nombre = payload.nombre;
        sugerencia.tipo = payload.tipo;
        sugerencia.usuarioId = this.auth.id;
        sugerencia.centroId = sharedDbCentro.id;

        sugerenciaStored = await sugerenciaRp.save(sugerencia);
      }

      await qr.commitTransaction();
      return sugerenciaStored;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async fetch(keyword: string, tipo: TipoSugerenciaTypeCode) {
    const sharedDbDs = switchConn(GCM_CONTEXTS.EKLIPSE);

    const sugerenciaRp = sharedDbDs.getRepository(SugerenciaOSRD);

    const sugerencias = await sugerenciaRp.find({
      where: { nombre: Like(`%${keyword}%`), tipo },
      take: 5,
      select: {
        id: true,
        nombre: true,
        tipo: true,
      },
    });

    return sugerencias;
  }

  public async fetchProductos(keyword: string, centroId: number) {
    const sharedDbDs = switchConn(GCM_CONTEXTS.EKLIPSE);

    const sharedDbCentroRp = sharedDbDs.getRepository(CentroOSRD);
    const sharedDbCentro = await sharedDbCentroRp.findOne({
      where: { id: centroId },
    });

    const finalDs =
      this.auth.context === GCM_CONTEXTS.AMMEDICAL
        ? switchConn(gcmContextFactory(sharedDbCentro.contexto))
        : this.conn;

    const recTecSugerenciaRepo = finalDs.getRepository(ProductoOrm);

    const sugerencias = await recTecSugerenciaRepo.find({
      where: [
        { descripcionCorta: Like(`%${keyword}%`), isBloqueado: false },
        { descripcionLarga: Like(`%${keyword}%`), isBloqueado: false },
      ],
      take: 5,
      select: {
        id: true,
        codigo: true,
        descripcionCorta: true,
        descripcionLarga: true,
      },
    });

    sugerencias.map(el => {
      el.nombre = el.descripcionCorta;
    });

    return sugerencias;
  }

  public async fetchCentros(getAll: boolean) {
    try {
      let centros;

      if (!getAll) {
        if (this.auth.context !== GCM_CONTEXTS.AMMEDICAL) {
          centros = await this.conn.query(
            `SELECT OID id, ACACODIGO codigo, ACANOMBRE nombre FROM ADNCENATE`
          );
          centros.map(el => {
            el.contexto = this.auth.context;
          });
        } else {
          const ds = switchConn(GCM_CONTEXTS.EKLIPSE);
          const centroRp = ds.getRepository(CentroOSRD);
          const centro = await centroRp.findOne({
            where: { contexto: GCM_CONTEXTS.AMMEDICAL.getCode() },
          });
          const otrosCentros = await centroRp.find({
            where: { contexto: In([GcmContexts.ALTACENTRO]) },
          });

          centros = [centro, ...otrosCentros];
        }
      } else {
        const ds = switchConn(GCM_CONTEXTS.EKLIPSE);
        const centroRp = ds.getRepository(CentroOSRD);
        const allCentros = await centroRp.find();

        centros = allCentros;
      }

      return centros;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
