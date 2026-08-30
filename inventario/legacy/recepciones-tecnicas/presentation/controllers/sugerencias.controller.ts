import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateSugerenciaDto } from '../dtos';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { RCTSugerenciasImpl } from '@inn/lgc/rct/infrastructure/services';
import { SugerenciaCode } from '@inn/lgc/rct/types/inn/farmacia/recepcion-tecnica';
import { INN_AUTHORITIES } from '@inn/authorities';

@CommonGuards()
@Controller('v1/fmc/rec-tec')
export class SugerenciasController {
  constructor(private _sugerencias: RCTSugerenciasImpl) {}

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Post('sugerencias')
  async createSugerencia(@Body() payload: CreateSugerenciaDto) {
    return this._sugerencias.create(payload);
  }

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Get('sugerencias')
  async fetchSugerencias(@Query('keyword') keyword: string, @Query('tipo') tipo: SugerenciaCode) {
    return this._sugerencias.fetch(keyword, tipo);
  }
}
