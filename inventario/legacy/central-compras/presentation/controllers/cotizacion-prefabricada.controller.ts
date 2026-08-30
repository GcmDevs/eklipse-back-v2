import { Controller, Get, Query, BadRequestException, Body, Post, Patch } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';

import { AddOfertaDto, CotiPrefaDto, UpdateValorDto } from '../dtos';
import { ApiTags } from '@nestjs/swagger';
import { INN_AUTHORITIES } from '@inn/authorities';
import { CotizacionPrefabricadaCrudSource } from '../../infrastructure/repositories';
import { CotizacionPrefabricadaServices, FetchItemsImpl } from '../../infrastructure/services';

@CommonGuards()
@ApiTags('Cotizaciones prefabricadas')
@Controller('v1/inn/ctc/cotizaciones/prefabricadas')
export class CotizacionPrefabricadaController {
  constructor(
    private _fetchItems: FetchItemsImpl,
    private _cotiPrefaCrud: CotizacionPrefabricadaCrudSource,
    private _cotiPrefaServices: CotizacionPrefabricadaServices
  ) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTI_PREFABRI])
  @Get('fetch-items')
  public async fetchItems(@Query('grupoId') grupoId: number) {
    try {
      return this._fetchItems.execute(grupoId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTI_PREFABRI])
  @Post()
  public async create(@Body() body: CotiPrefaDto[]) {
    try {
      return this._cotiPrefaCrud.create(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTI_PREFABRI])
  @Get()
  public async fetch() {
    try {
      return this._cotiPrefaCrud.fetch();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTI_PREFABRI_MODIFICAR_VALORES])
  @Patch('update-valor')
  public async updateValor(@Body() body: UpdateValorDto) {
    try {
      return this._cotiPrefaServices.updateValor(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTI_PREFABRI_MODIFICAR_VALORES])
  @Post('add-oferta')
  public async addOferta(@Body() body: AddOfertaDto) {
    try {
      return this._cotiPrefaServices.addOferta(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTI_PREFABRI_MODIFICAR_VALORES])
  @Get('registrar-data')
  public async registrarProveedores() {
    try {
      return this._cotiPrefaServices.registrarProveedores();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
