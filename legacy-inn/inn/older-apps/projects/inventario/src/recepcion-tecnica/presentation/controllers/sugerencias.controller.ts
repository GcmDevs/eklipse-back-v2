import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateSugerenciaDto } from '../dtos';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SugerenciasService } from '@inn/old/inn/recepcion-tecnica/infrastructure/services';
import { INN_AUTHORITIES } from '@inn/old/authorities/inventario';
import {
  CONDICIONES_TRANSPORTE_VALUES,
  ESTADOS_EMBALAJE_VALUES,
  ESTADOS_REG_INVIMA_VALUES,
  TIPOS_SUGERENCIAS_VALUES,
  TipoSugerenciaTypeCode,
} from '@inn/old/inn/recepcion-tecnica/domain/types';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v10/inn/recepcion-tecnica/sugerencias')
export class SugerenciasController {
  constructor(private _sugerencias: SugerenciasService) {}

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Post()
  async createSugerencia(@Body() payload: CreateSugerenciaDto) {
    return this._sugerencias.create(payload);
  }

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Get()
  async fetchSugerencias(
    @Query('keyword') keyword: string,
    @Query('tipo') tipo: TipoSugerenciaTypeCode
  ) {
    return this._sugerencias.fetch(keyword, tipo);
  }

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Get('productos')
  async fetchSugerenciasProductos(
    @Query('keyword') keyword: string,
    @Query('centroId') centroId: number
  ) {
    return this._sugerencias.fetchProductos(keyword, +centroId);
  }

  @Get('centros')
  async fetchSugerenciasCentros(@Query('getAll') getAll: boolean) {
    return this._sugerencias.fetchCentros(getAll);
  }

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Get('types')
  async fetchTypes() {
    return {
      condicionesTransporte: CONDICIONES_TRANSPORTE_VALUES,
      estadosRegInvima: ESTADOS_REG_INVIMA_VALUES,
      tiposEmbalaje: ESTADOS_EMBALAJE_VALUES,
      tiposSugerencias: TIPOS_SUGERENCIAS_VALUES,
    };
  }
}
