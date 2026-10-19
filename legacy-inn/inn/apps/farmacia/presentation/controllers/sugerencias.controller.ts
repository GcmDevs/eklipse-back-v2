import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateSugerenciaDto } from '../dtos';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { RCTSugerenciasImpl } from '@inn/farmacia/infrastructure/services';
import { RCTSugerenciaCode } from '@inn/farmacia/domain/types/rec-tec';

@ApiTags('V1 - Productos (Recepción tecnica)')
@CommonGuards()
@Controller('v1/pdts/rtc/sugerencias')
export class SugerenciasController {
  constructor(private _sugerencias: RCTSugerenciasImpl) {}

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Post()
  async createSugerencia(@Body() payload: CreateSugerenciaDto) {
    return this._sugerencias.create(payload);
  }

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Get()
  async fetchSugerencias(
    @Query('keyword') keyword: string,
    @Query('tipo') tipo: RCTSugerenciaCode
  ) {
    return this._sugerencias.fetch(keyword, tipo);
  }
}
