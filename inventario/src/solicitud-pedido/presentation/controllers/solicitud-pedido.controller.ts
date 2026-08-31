import { ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { INN_AUTHORITIES } from '@inn/authorities';
import { Authorities } from '@common/presentation/decorators';
import {
  ActualizarDespachoSolicitudPedidoPayload,
  CreateSolicitudPedidoPayload,
  ImpactoSobrepedidoPayload,
  ReporteSolicitudPedidoQuery,
  RechazarSolicitudPedidoPayload,
} from '../dtos';
import {
  ActualizarDespachoSolicitudPedidoImpl,
  BuscarProductoImpl,
  CreateSolicitudPedidoImpl,
  FetchDetalleSolicitudPedidoImpl,
  FetchSolicitudPedidosImpl,
  ImpactoSobrepedidoDesactualizadoError,
  ImpactoSobrepedidoImpl,
  ReporteSolicitudPedidoImpl,
  RechazarSolicitudPedidoImpl,
} from '@inn/solicitud-pedido/infraestructure/services';
import { GcmContextCode } from '@common/domain/types';

@ApiTags('Solicitud Pedido')
@Controller('v1/inn/solicitud-pedido')
export class SolicitudPedidoController {
  constructor(
    private readonly _fetch: FetchSolicitudPedidosImpl,
    private readonly _create: CreateSolicitudPedidoImpl,
    private readonly _buscarProducto: BuscarProductoImpl,
    private readonly _actualizarDespacho: ActualizarDespachoSolicitudPedidoImpl,
    private readonly _fetchDetalle: FetchDetalleSolicitudPedidoImpl,
    private readonly _rechazar: RechazarSolicitudPedidoImpl,
    private readonly _impactoSobrepedido: ImpactoSobrepedidoImpl,
    private readonly _reporte: ReporteSolicitudPedidoImpl
  ) {}

  @Authorities([INN_AUTHORITIES.SOLICITUD_PEDIDO.SOLICITAR_PEDIDO])
  @Get('reporte')
  async getReporte(@Query() query: ReporteSolicitudPedidoQuery) {
    try {
      return await this._reporte.execute(query.contextCode, query.sedeId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SOLICITUD_PEDIDO.FACTURAR_PEDIDO])
  @Post('despachar-productos')
  async despacharProductos(@Body() payload: ActualizarDespachoSolicitudPedidoPayload) {
    try {
      return await this._actualizarDespacho.execute(payload);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SOLICITUD_PEDIDO.FACTURAR_PEDIDO])
  @Post('rechazar')
  async rechazar(@Body() payload: RechazarSolicitudPedidoPayload) {
    try {
      return await this._rechazar.execute(payload);
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

  @Authorities([
    INN_AUTHORITIES.SOLICITUD_PEDIDO.SOLICITAR_PEDIDO,
    INN_AUTHORITIES.SOLICITUD_PEDIDO.FACTURAR_PEDIDO,
  ])
  @Get('detalle/:contextCode/:numeroSolicitud')
  async fetchDetalle(
    @Param('contextCode') contextCode: GcmContextCode,
    @Param('numeroSolicitud') numeroSolicitud: string
  ) {
    try {
      return await this._fetchDetalle.execute(contextCode, numeroSolicitud);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SOLICITUD_PEDIDO.SOLICITAR_PEDIDO])
  @Post('impacto-sobrepedido')
  async impactoSobrepedido(@Body() payload: ImpactoSobrepedidoPayload) {
    try {
      return await this._impactoSobrepedido.execute(payload);
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
      if (error instanceof ImpactoSobrepedidoDesactualizadoError) {
        throw new ConflictException({
          code: 'IMPACTO_SOBREPEDIDO_CAMBIO',
          message: error.message,
          impacto: error.impacto,
        });
      }
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
