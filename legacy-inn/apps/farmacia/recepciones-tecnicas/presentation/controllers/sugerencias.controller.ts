import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateSugerenciaDto } from '../dtos';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { RCTSugerenciasImpl } from '@farmacia/recepciones-tecnicas/infrastructure/services';
import { SugerenciaCode } from '@ctypes/inn/farmacia/recepcion-tecnica';

@CommonGuards()
@Controller('v4/farmacia/recepciones-tecnicas')
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
