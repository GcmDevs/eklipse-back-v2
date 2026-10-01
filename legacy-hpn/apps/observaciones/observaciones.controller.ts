import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObservacionBody, ObservacionesService } from './observaciones.service';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/observaciones')
export class ObservacionesController {
  constructor(private readonly observacionesService: ObservacionesService) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES])
  @Get('find-by-management/:management')
  async getAllByPaciente(
    @Req() @Param('management') management: string,
    @Query('contextoCode') contextoCode: GcmContextCode
  ) {
    return await this.observacionesService.findByManagement(
      +management,
      gcmContextFactory(contextoCode)
    );
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES])
  @Post()
  async create(@Body() body: ObservacionBody) {
    return await this.observacionesService.create(body);
  }
}
