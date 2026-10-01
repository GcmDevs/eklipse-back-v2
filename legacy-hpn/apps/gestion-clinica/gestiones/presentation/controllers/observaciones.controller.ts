import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import {
  ObservacionBody,
  ObservacionSource,
} from '@gestion-clinica/gestiones/infrastructure/repositories';

@CommonGuards()
@Controller('v4/gestion-clinica/observaciones')
export class ObservacionesController {
  constructor(private readonly observacionesCrud: ObservacionSource) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES])
  @Get('find-by-management/:management')
  async getAllByPaciente(
    @Req() @Param('management') management: string,
    @Query('contextoCode') contextoCode: GcmContextCode
  ) {
    return await this.observacionesCrud.findByManagement(
      +management,
      gcmContextFactory(contextoCode)
    );
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES])
  @Post()
  async create(@Body() body: ObservacionBody) {
    return await this.observacionesCrud.create(body);
  }
}
