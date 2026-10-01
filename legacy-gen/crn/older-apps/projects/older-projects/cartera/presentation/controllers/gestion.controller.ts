import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { FindTerceroByNitHandler, GestionHandler } from '../handlers';
import { Authorities, CommonGuards } from '@crn/old/common/presentation/decorators';
import { CRN_AUTHORITIES } from '@authorities/cartera';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v30/cartera/gestion')
export class GestionController {
  constructor(
    private _gestiones: GestionHandler,
    private _findTerceroByNit: FindTerceroByNitHandler
  ) {}

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Get('/find-tercero-by-nit/:nit')
  async findTerceroByNit(@Param('nit') nit: string) {
    return await this._findTerceroByNit.execute(nit);
  }

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Get()
  async fetch(@Query('inicio') inicio: Date, @Query('final') final: Date) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    return await this._gestiones.fetch(inicio, final);
  }
}
