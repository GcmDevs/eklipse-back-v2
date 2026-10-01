import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import {
  UpdateExistenciaEstantePayload,
  VerificarEstantePayload,
} from '@farmacia/inn-ciclico/application/payloads';
import {
  HistoricoVerificarEstanteImpl,
  FetchExistenciaProductoImpl,
  UpdateExistenciaProductoImpl,
  VerificarEstanteImpl,
  FetchEstantesImpl,
  EstadisticasImpl,
  RecursosImpl,
  CambioEstanteImpl,
  HistoricoCambioEstanteImpl,
  BuscarProductoImpl,
  AgregarProductoImpl,
} from '@farmacia/inn-ciclico/infrastructure/services';

@CommonGuards()
@Controller('v4/inn-ciclico')
export class InnCiclicoController {
  constructor(
    private _historicoVerificacionesEstantes: HistoricoVerificarEstanteImpl,
    private _fetchExistenciaProducto: FetchExistenciaProductoImpl,
    private _updateExistencias: UpdateExistenciaProductoImpl,
    private _verificarEstante: VerificarEstanteImpl,
    private _fetchEstantes: FetchEstantesImpl,
    private _estadisticas: EstadisticasImpl,
    private _recursos: RecursosImpl,
    private _cambioEstante: CambioEstanteImpl,
    private _historicoCambioEstante: HistoricoCambioEstanteImpl,
    private _buscarProducto: BuscarProductoImpl,
    private _agregarNuevoProducto: AgregarProductoImpl
  ) {}

  @Put('agregar-producto/:productId/:estanteId/:stock')
  async AgregarNuevoProducto(
    @Param('productId') productoId: number,
    @Param('estanteId') estanteId: number,
    @Param('stock') stock: number
  ) {
    try {
      return await this._agregarNuevoProducto.execute(productoId, estanteId, stock);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('buscar-producto')
  async buscarProducto(@Query('pattern') pattern: string) {
    try {
      return await this._buscarProducto.execute(pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.GESTION_INVENTARIO_CICLICO])
  @Put('add-product/:productId/:estanteIdOrigen/:estanteIdDestino')
  async addProduct(
    @Param('productId') productId: number,
    @Param('estanteIdOrigen') estanteOrigenId: number,
    @Param('estanteIdDestino') estanteDestinoId: number
  ) {
    try {
      return await this._cambioEstante.execute(+productId, +estanteOrigenId, +estanteDestinoId);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([INN_AUTHORITIES.FARMACIA.GESTION_INVENTARIO_CICLICO])
  @Get('historico-cambio-estante/:productId')
  async fetchHistoricoCambioEstante(
    @Param('productId') productId: number
    // @Param('estanteOrigenId') estanteOrigenId: number,
    // @Param('estanteDestinoId') estanteDestinoId: number
  ) {
    try {
      return await this._historicoCambioEstante.execute(+productId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.GESTION_INVENTARIO_CICLICO])
  @Get('estadisticas')
  async estadisticas() {
    try {
      return await this._estadisticas.execute();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.GESTION_INVENTARIO_CICLICO])
  @Get('fetch-estantes/:estanteId')
  async fetchEstantesById(
    @Param('estanteId') estanteId: number,
    @Query('includeExistencias') includeExistencias: boolean
  ) {
    try {
      return await this._fetchEstantes.byId(+estanteId, includeExistencias);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.GESTION_INVENTARIO_CICLICO])
  @Put('update-existencia/:estanteId')
  async updateExistencia(
    @Param('estanteId') estanteId: number,
    @Body() body: UpdateExistenciaEstantePayload[]
  ) {
    try {
      return await this._updateExistencias.execute(+estanteId, body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.GESTION_INVENTARIO_CICLICO])
  @Get('historico/:productoId/:estanteId')
  async fetchHistorico(
    @Param('productoId') productoId: number,
    @Param('estanteId') estanteId: number
  ) {
    try {
      return await this._fetchExistenciaProducto.historico(+productoId, +estanteId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.VERIFICAR_INVENTARIO_CICLICO])
  @Post('verificar/:estanteId')
  async verificar(@Param('estanteId') estanteId: number, @Body() body: VerificarEstantePayload) {
    try {
      return await this._verificarEstante.execute(+estanteId, body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.VERIFICAR_INVENTARIO_CICLICO])
  @Get('verificar/historico/:estanteId')
  async fetchHistoricoVerificaciones(@Param('estanteId') estanteId: number) {
    try {
      return await this._historicoVerificacionesEstantes.execute(+estanteId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('recursos/almacenes')
  async fetchSolicitudes(@Query('pattern') pattern: string) {
    try {
      const result = await this._recursos.fetchAlmacenes(pattern);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
