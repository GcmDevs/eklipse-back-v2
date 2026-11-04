import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { CreateDietaDto } from '@lgc/die/presentation/dtos';
import { removeTimeZone } from '@lgc/die/application/services';
import { HPN_AUTHORITIES } from '@authorities';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { DietasBaseSource } from '../sources';
import { RegistrarDietasSubgrupoService } from './registrar-dietas-subgrupo.service';

@Injectable()
export class CreateDietasBySubgrupoImpl extends DietasBaseSource {
  constructor(
    @Inject(REQUEST) request: Request,
    private readonly registro: RegistrarDietasSubgrupoService
  ) {
    super(request);
  }

  public async execute(payload: CreateDietaDto) {
    try {
      const canIgnoreHorario = await this.hasAnyAuthority([
        ADMIN_AUTHORITY,
        HPN_AUTHORITIES.DIETAS.REGISTRAR_IGNORA_JORNADA,
      ]);
      const fecha = new Date(
        `${removeTimeZone(new Date()).toISOString().slice(0, 10)}T00:00:00.000Z`
      );
      const result = await this.registro.execute(payload, {
        conn: this.conn,
        context: this.auth.context,
        usuarioId: this.auth.user.id,
        fecha,
        origen: 'MANUAL',
        canIgnoreHorario,
      });
      return { success: result.success, message: result.message, data: result.data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
