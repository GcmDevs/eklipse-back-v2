import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  RecTecSugerenciaOrm,
  TipoSugerenciaTypeCode,
} from '@inn/old/orm/gcm/inventario/recepcion-tecnica';
import { CreateSugerenciaRequest } from '@inn/rft/inventario/recepcion-tecnica/presentation/requests';
import { Like } from 'typeorm';
import { ProductoOrm } from '@inn/old/orm/dim/inventario';

@Injectable()
export class SugerenciasService extends BaseSource {
  public async create(payload: CreateSugerenciaRequest): Promise<RecTecSugerenciaOrm> {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const recTecSugerenciaRepo = this.qr.manager.getRepository(RecTecSugerenciaOrm);

      const { nombre, tipo } = payload;

      let sugerenciaStored = await recTecSugerenciaRepo.findOne({ where: { nombre, tipo } });

      if (!sugerenciaStored) {
        const sugerencia = new RecTecSugerenciaOrm();
        sugerencia.nombre = payload.nombre;
        sugerencia.tipo = payload.tipo;
        sugerencia.usuarioId = this.auth.id;

        sugerenciaStored = await recTecSugerenciaRepo.save(sugerencia);
      }

      await this.qr.commitTransaction();

      return sugerenciaStored;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async fetch(keyword: string, tipo: TipoSugerenciaTypeCode) {
    const recTecSugerenciaRepo = this.conn.getRepository(RecTecSugerenciaOrm);

    const sugerencias = await recTecSugerenciaRepo.find({
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

  public async fetchProductos(keyword: string) {
    const recTecSugerenciaRepo = this.conn.getRepository(ProductoOrm);

    const sugerencias = await recTecSugerenciaRepo.find({
      where: [
        { descripcionCorta: Like(`%${keyword}%`) },
        { descripcionLarga: Like(`%${keyword}%`) },
      ],
      take: 5,
      select: {
        id: true,
        codigo: true,
        descripcionCorta: true,
        descripcionLarga: true,
      },
    });

    (sugerencias as any).map(_ => {
      _.nombre = _.descripcionCorta;
    });

    return sugerencias;
  }
}
