import { BaseSource } from '@common/infrastructure/services';
import {
  DieEstadoType,
  DieJorEstadoType,
  ESTADOS_DIETA,
  ESTADOS_JORNADA,
  MotivoDevolucionDietaCode,
  dieEstadoTypeFactory,
} from '@lgc/die/domain/types/local';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DieEstadoOrm, DieJornadaOrm } from '../models/local';

@Injectable()
export class ManageEntregaDietasImpl extends BaseSource {
  public PDYDIECen: any;
  public estado: any;
  public estados = [];
  constructor(@Inject(REQUEST) request: Request) {
    super(request);
  }

  async updateEstadoJornada(id: number, estado: DieJorEstadoType) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const dieJornadaRp = this.qr.manager.getRepository(DieJornadaOrm);
      const dieJornada = await dieJornadaRp.findOne({ where: { id } });
      if (!dieJornada) throw new BadRequestException('No se encontró jornada con este id');

      dieJornada.estadoCode = estado.getCode();
      await dieJornadaRp.save(dieJornada);

      await this.qr.commitTransaction();

      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  async updateEstadoDieta(
    id: number,
    estado: DieEstadoType,
    motivoDevCode?: MotivoDevolucionDietaCode | null,
    observacionDev?: string | null
  ) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const dietaRp = this.qr.manager.getRepository(DieEstadoOrm);
      const dieta = await dietaRp.findOne({ where: { id } });

      if (!dieta) throw new BadRequestException(`No existe dieta con este id`);

      dieta.setTypes();

      if (dieta.estadoCode !== ESTADOS_DIETA.PENDIENTE.getCode()) {
        throw new BadRequestException(`La dieta ya fue ${dieta.estado.getForHumans()} previamente`);
      }

      dieta.estadoCode = estado.getCode();
      if (motivoDevCode) dieta.motivoDevolucionCode = motivoDevCode;
      if (observacionDev) dieta.observacionDevolucion = observacionDev;

      await dietaRp.save(dieta);

      await this.qr.commitTransaction();

      return dieta;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
