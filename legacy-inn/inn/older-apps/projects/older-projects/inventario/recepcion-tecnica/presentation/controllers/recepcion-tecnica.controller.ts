import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { AUTHORITIES } from '@inn/old/authorities/principal';
import {
  CONDICIONES_TRANSPORTE_VALUES,
  ESTADOS_REG_INVIMA_VALUES,
  ESTADOS_EMBALAJE_VALUES,
  RecepcionTecnicaOrm,
  TIPOS_SUGERENCIAS_VALUES,
  RecTecSugerenciaOrm,
  TipoSugerenciaTypeCode,
} from '@inn/old/orm/gcm/inventario/recepcion-tecnica';
import { CreateRecepcionTecnicaRequest, CreateSugerenciaRequest } from '../requests';
import {
  RecepcionTecnicaCrudService,
  SugerenciasService,
} from '@inn/rft/inventario/recepcion-tecnica/infrastructure/services';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v30/recepcion-tecnica')
export class RecepcionTecnicaController {
  constructor(
    private _recepcionTecnicaCrud: RecepcionTecnicaCrudService,
    private _sugerencias: SugerenciasService
  ) {}

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.INVENTARIO.RECEPCION_TECNICA.GENERAR_CONSULTAR,
  ])
  @Get()
  async fetch(): Promise<RecepcionTecnicaOrm[]> {
    return this._recepcionTecnicaCrud.fetch();
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.INVENTARIO.RECEPCION_TECNICA.GENERAR_CONSULTAR,
  ])
  @Post()
  async create(@Body() payload: CreateRecepcionTecnicaRequest): Promise<RecepcionTecnicaOrm> {
    return this._recepcionTecnicaCrud.create(payload);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.INVENTARIO.RECEPCION_TECNICA.GENERAR_CONSULTAR,
  ])
  @Put()
  async update(@Body() payload: CreateRecepcionTecnicaRequest) {
    return this._recepcionTecnicaCrud.create(payload);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.INVENTARIO.RECEPCION_TECNICA.GENERAR_CONSULTAR,
  ])
  @Post('sugerencias')
  async createSugerencia(@Body() payload: CreateSugerenciaRequest): Promise<RecTecSugerenciaOrm> {
    return this._sugerencias.create(payload);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.INVENTARIO.RECEPCION_TECNICA.GENERAR_CONSULTAR,
  ])
  @Get('sugerencias')
  async fetchSugerencias(
    @Query('keyword') keyword: string,
    @Query('tipo') tipo: TipoSugerenciaTypeCode
  ) {
    return this._sugerencias.fetch(keyword, tipo);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.INVENTARIO.RECEPCION_TECNICA.GENERAR_CONSULTAR,
  ])
  @Get('sugerencias-productos')
  async fetchSugerenciasProductos(@Query('keyword') keyword: string) {
    return this._sugerencias.fetchProductos(keyword);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.INVENTARIO.RECEPCION_TECNICA.GENERAR_CONSULTAR,
  ])
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
