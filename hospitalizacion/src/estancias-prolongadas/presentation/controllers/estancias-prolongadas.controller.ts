import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ActivityFeedQueryDto,
  ActualizarAccionDominioDto,
  ActualizarEstanciaProlongadaDto,
  BuscarEstanciasQueryDto,
  CerrarEstanciaDto,
  CrearEstanProDto,
  CrearSeguimientoSemanaDto,
} from '../dtos';
import {
  ActualizarAccionImpl,
  ActualizarEstanciaProlongadaImpl,
  CensoEstanciasProlongadasImpl,
  CerrarEstanciaImpl,
  CrearEstanciasProlongadasImpl,
  CrearSeguimientoImpl,
  EstanciaProlongadaByIdImpl,
  EstanciasProlongadasActivasImpl,
  EstanciasProlongadasQueryImpl,
  ListarSeguimientosImpl,
  ObtenerActivityFeedImpl,
} from '@hpn/estancias-prolongadas/infraestructure/services/estancias';

// @CommonGuards()
@ApiTags('v1 - Estancias Prolongadas')
@Controller('v1/estancias-prolongadas')
export class EstanciasProlongadasController {
  constructor(
    private readonly _crearEstanciaImpl: CrearEstanciasProlongadasImpl,
    private readonly _cerrarEstanciaImpl: CerrarEstanciaImpl,
    private readonly _censoImpl: CensoEstanciasProlongadasImpl,
    private readonly _estanciasProlongadasActivasImpl: EstanciasProlongadasActivasImpl,
    private readonly _estanciasProlongadasQuery: EstanciasProlongadasQueryImpl,
    private readonly _obtenerActivityFeedImpl: ObtenerActivityFeedImpl,
    private readonly _crearSeguimientoImpl: CrearSeguimientoImpl,
    private readonly _listarSeguimientosImpl: ListarSeguimientosImpl,
    private readonly _estanciaProlongadaByIdImpl: EstanciaProlongadaByIdImpl,
    private readonly _actualizarEstanciaProlongadaImpl: ActualizarEstanciaProlongadaImpl,
    private readonly _actualizarAccionImpl: ActualizarAccionImpl
  ) {}

  private handleError(error: any): never {
    if (error instanceof HttpException) throw error;
    throw new BadRequestException(error.message);
  }
  @Get('censo')
  public async fetchCenso() {
    try {
      return await this._censoImpl.fetchCenso();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Post()
  public async crearEstancia(@Body() body: CrearEstanProDto) {
    try {
      return await this._crearEstanciaImpl.crearEstanciasProlongadas(body);
    } catch (error: any) {
      this.handleError(error);
    }
  }
  @Get()
  public async getEstanciasProlongadasActivas() {
    try {
      return await this._estanciasProlongadasActivasImpl.getEstanciasProlongadasActivas();
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get('query')
  public async obtenerEstancias(@Query() query: BuscarEstanciasQueryDto) {
    try {
      return await this._estanciasProlongadasQuery.getEstanciasProlongadasQuery(query);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get('admin/activity-feed')
  public async obtenerActivityFeed(@Query() query: ActivityFeedQueryDto) {
    try {
      return await this._obtenerActivityFeedImpl.obtenerActivityFeed(query);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Post(':id/seguimientos')
  public async crearSeguimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CrearSeguimientoSemanaDto
  ) {
    try {
      return await this._crearSeguimientoImpl.crearSeguimiento(id, body);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get(':id/seguimientos')
  public async listarSeguimientos(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this._listarSeguimientosImpl.listarSeguimientos(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Patch(':id/cierre')
  public async cerrarEstancia(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CerrarEstanciaDto
  ) {
    try {
      return await this._cerrarEstanciaImpl.cerrarEstancia(id, body);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get(':id')
  public async getEstanciaProlongadaById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this._estanciaProlongadaByIdImpl.getEstanciaProlongadaById(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Patch(':id')
  public async actualizarEstancia(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarEstanciaProlongadaDto
  ) {
    try {
      return await this._actualizarEstanciaProlongadaImpl.actualizarEstancia(id, body);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Patch(':id/acciones/:accionId')
  public async actualizarAccion(
    @Param('id', ParseIntPipe) id: number,
    @Param('accionId', ParseIntPipe) actionId: number,
    @Body() body: ActualizarAccionDominioDto
  ) {
    try {
      return await this._actualizarAccionImpl.actualizarAccion(id, actionId, body);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}
