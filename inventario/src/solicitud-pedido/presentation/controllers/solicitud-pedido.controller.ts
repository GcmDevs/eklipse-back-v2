import { ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { diskStorage } from 'multer';

import { INN_AUTHORITIES } from '@inn/authorities';
import { nonEditFileName } from '@common/presentation/helpers';
import { Authorities } from '@common/presentation/decorators';
import { FILE_LOCATIONS } from '@common/application/constants/file-locations';
import {
  ActualizarDespachoSolicitudPedidoPayload,
  CargarFacturaSolicitudPedidoPayload,
  CreateSolicitudPedidoPayload,
  DocumentoVistoSolicitudPedidoPayload,
  GenerateReporteSolicitudPedidoPayoad,
  RechazarSolicitudPedidoPayload,
} from '../dtos';
import {
  ActualizarDespachoSolicitudPedidoImpl,
  BuscarProductoImpl,
  CreateSolicitudPedidoImpl,
  FetchSolicitudPedidosImpl,
} from '@inn/solicitud-pedido/infraestructure/services';

@ApiTags('Solicitud Pedido')
@Controller('v1/inn/solicitud-pedido')
export class SolicitudPedidoController {
  constructor(
    private readonly _fetch: FetchSolicitudPedidosImpl,
    private readonly _create: CreateSolicitudPedidoImpl,
    private readonly _buscarProducto: BuscarProductoImpl,
    private readonly _actualizarDespacho: ActualizarDespachoSolicitudPedidoImpl
  ) {}

  @Authorities([INN_AUTHORITIES.SOLICITUD_PEDIDO.FACTURAR_PEDIDO])
  @Post('despachar-productos')
  async despacharProductos(@Body() payload: ActualizarDespachoSolicitudPedidoPayload) {
    try {
      return await this._actualizarDespacho.execute(payload);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    INN_AUTHORITIES.SOLICITUD_PEDIDO.SOLICITAR_PEDIDO,
    INN_AUTHORITIES.SOLICITUD_PEDIDO.FACTURAR_PEDIDO,
  ])
  @Get()
  async fetch(@Query('fechaInicio') fechaInicio: Date, @Query('fechaFin') fechaFin: Date) {
    try {
      fechaInicio = new Date(`${fechaInicio}:00:00:00`);
      fechaFin = new Date(`${fechaFin}:23:59:59`);
      return await this._fetch.execute(fechaInicio, fechaFin);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SOLICITUD_PEDIDO.SOLICITAR_PEDIDO])
  @Post()
  async create(@Body() body: CreateSolicitudPedidoPayload) {
    try {
      return await this._create.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('buscar-producto/:codigo')
  async buscarProducto(
    @Param('codigo') codigo: string,
    @Query('sedeId', ParseIntPipe) sedeId: number
  ) {
    try {
      return await this._buscarProducto.execute(codigo, sedeId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
