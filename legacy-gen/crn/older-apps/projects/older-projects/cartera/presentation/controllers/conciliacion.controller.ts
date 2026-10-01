import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { ConciliacionHandler } from '../handlers';
import { Authorities, CommonGuards } from '@crn/old/common/presentation/decorators';
import { CRN_AUTHORITIES } from '@authorities/cartera';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v30/cartera/conciliacion')
export class ConciliacionController {
  constructor(private _conciliaciones: ConciliacionHandler) {}

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Get()
  async fetch(@Query('inicio') inicio: Date, @Query('final') final: Date) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    return await this._conciliaciones.fetch(inicio, final);
  }
}
