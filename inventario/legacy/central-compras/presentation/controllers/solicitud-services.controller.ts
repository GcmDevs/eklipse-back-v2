import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { SolicitudServicesSource } from '@inn/lgc/ctc/infrastructure/services';
import {
  AprobacionCotizacionByCtCDto,
  AprobacionSolicitudByGerenteDto,
  ConvertirACajaMenorExpressDto,
  ItemsRecomendadosByCotizadorDto,
  UpdateItemSolicitudCompraDto,
  UpdateSolicitudColaboradorDto,
} from '../dtos';
import { CtcPermisosRes } from '@inn/lgc/ctc/infrastructure/responses';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@inn/authorities';

@CommonGuards()
@ApiTags('Solicitudes')
@Controller('v1/inn/ctc/solicitudes')
export class SolicitudCompraServicesController {
  constructor(private _services: SolicitudServicesSource) {}

  @ApiOkResponse({ type: CtcPermisosRes })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get('mis-permisos')
  async fetchMisPermisos() {
    try {
      const response = await this._services.fetchMisPermisos();
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Patch('update-solicitud-colaborador')
  public async updateSolicitudColaborador(
    @Body() payload: UpdateSolicitudColaboradorDto
  ): Promise<boolean> {
    try {
      const response = await this._services.updateSolicitudColaborador(payload);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.APRO_RECH_GERENTE])
  @Patch('aprobacion-gerente')
  public async aprobacionGerente(@Body() body: AprobacionSolicitudByGerenteDto): Promise<boolean> {
    try {
      const response = await this._services.aprobacionGerente(body);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.RECOMENDAR_ITEMS_COTI])
  @Patch('recomendar-items-cotizados')
  public async recomeItemsCoti(@Body() body: ItemsRecomendadosByCotizadorDto): Promise<boolean> {
    try {
      const response = await this._services.recomendarItemsCotizaciones(body);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.APRO_RECH_COTI_RECOMEN])
  @Patch('aprobacion-items-cotizados')
  public async aprobarItemsCoti(@Body() body: AprobacionCotizacionByCtCDto): Promise<boolean> {
    try {
      const response = await this._services.aprobacionItemsCotizadosCtC(body);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC])
  @Patch('update-item-solicitud-compra')
  public updateItemSolicitudCompra(@Body() body: UpdateItemSolicitudCompraDto) {
    try {
      return this._services.updateItemSolicitudCompra(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CAJA_MENOR_EXPRESS])
  @Post('caja-menor-express')
  public async cajaMenorExpress(@Body() body: ConvertirACajaMenorExpressDto): Promise<boolean> {
    try {
      const response = await this._services.cajaMenorExpress(body);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
