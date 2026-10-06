import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ConfDietaExtraHandler, FetchDietasByFechaHandler } from '../handlers';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { DIE_AUTHORITIES } from '@lgc/die/application/constants';
import { ConfDietaExtraRequest } from '../dtos';
import { getDateRangeByDay } from '../helpers';

@CommonGuards()
@ApiTags('v1 - Dietas')
@Controller('dim/dietas/v1')
export class DietasExtraordinariasController {
  constructor(
    private _confDietaExtra: ConfDietaExtraHandler,
    private _fetchDietasByFecha: FetchDietasByFechaHandler
  ) {}

  @Authorities([DIE_AUTHORITIES.EXTRA_CONFIG])
  @Get('extraordinarias/:ingreso')
  async infoDietasExtraordinarias(@Param('ingreso') ingreso: number) {
    return this._confDietaExtra.fetchDietaConfig(+ingreso);
  }

  @Authorities([DIE_AUTHORITIES.EXTRA_CONFIG])
  @Post('configurar-extraordinarias')
  async configurarDietasExtraordinariasPorIngreso(@Body() payload: ConfDietaExtraRequest) {
    return this._confDietaExtra.execute(payload);
  }

  @Authorities([DIE_AUTHORITIES.VER_JORNADA])
  @Get('fetch-dietas-by-fecha')
  async getJornadaDietas(@Query('fecha') fecha: Date) {
    fecha = new Date(`${fecha}:00:00`);
    return this._fetchDietasByFecha.execute(fecha);
  }
}
