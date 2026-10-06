import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ConfDietaExtraHandler, FetchDietasByFechaHandler } from '../handlers';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ConfDietaExtraRequest } from '../dtos';
import { HPN_AUTHORITIES } from '@authorities';

@CommonGuards()
@ApiTags('v1 - Dietas')
@Controller('dim/dietas/v1')
export class DietasExtraordinariasController {
  constructor(
    private _confDietaExtra: ConfDietaExtraHandler,
    private _fetchDietasByFecha: FetchDietasByFechaHandler
  ) {}

  @Authorities([HPN_AUTHORITIES.DIETAS.ASIGNAR_EXTRAORDINARIAS])
  @Get('extraordinarias/:ingreso')
  async infoDietasExtraordinarias(@Param('ingreso') ingreso: number) {
    return this._confDietaExtra.fetchDietaConfig(+ingreso);
  }

  @Authorities([HPN_AUTHORITIES.DIETAS.ASIGNAR_EXTRAORDINARIAS])
  @Post('configurar-extraordinarias')
  async configurarDietasExtraordinariasPorIngreso(@Body() payload: ConfDietaExtraRequest) {
    return this._confDietaExtra.execute(payload);
  }

  @Authorities([HPN_AUTHORITIES.DIETAS.VER_JORNADA])
  @Get('fetch-dietas-by-fecha')
  async getJornadaDietas(@Query('fecha') fecha: Date) {
    fecha = new Date(`${fecha}:00:00`);
    return this._fetchDietasByFecha.execute(fecha);
  }
}
