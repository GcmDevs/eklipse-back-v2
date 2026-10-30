import { INN_AUTHORITIES } from '@inn/authorities';
import { Authorities } from '@common/presentation/decorators';
import { BaseShelteredController } from '@common/presentation/controllers';
import { PaginationHelper } from '@common/presentation/helpers';
import { DotacionService } from '@inn/operaciones/turnos-vehiculos/application/services/dotacion.service';
import { LimpiezaService } from '@inn/operaciones/turnos-vehiculos/application/services/limpieza.service';
import { NovedadService } from '@inn/operaciones/turnos-vehiculos/application/services/novedad.service';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import {
  CerrarIncompletoDto,
  CorreccionDotacionDto,
  CorreccionLimpiezaDto,
  PatchDotacionItemDto,
  PatchLimpiezaItemDto,
  PatchLimpiezaMetaDto,
  ResolverNovedadDto,
} from '../dto/flota.dto';
import { DotacionGrillaQueryDto, DotacionSearchQueryDto, LimpiezaSearchQueryDto } from '../dto/flota-search.dto';

@Controller('/v4/inn/amb')
export class LimpiezaDotacionController extends BaseShelteredController {
  constructor(
    private readonly limpiezaService: LimpiezaService,
    private readonly dotacionService: DotacionService,
    private readonly novedadService: NovedadService,
  ) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Post('/turnos/:turnoId/limpiezas')
  async crearLimpieza(@Param('turnoId', ParseIntPipe) turnoId: number) {
    return { data: await this.limpiezaService.crearBorrador(turnoId) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/limpiezas')
  async listarLimpiezas(@Query() query: LimpiezaSearchQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, count] = await this.limpiezaService.search({
      search: query.search,
      vehiculoId: query.vehiculoId,
      turnoId: query.turnoId,
      estado: query.estado,
      desde: query.desde,
      hasta: query.hasta,
      page,
      limit,
    });
    return PaginationHelper.response(items, count, page, limit);
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/limpiezas/:id')
  async getLimpieza(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.limpiezaService.getById(id) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Patch('/limpiezas/:id')
  async patchLimpieza(@Param('id', ParseIntPipe) id: number, @Body() dto: PatchLimpiezaMetaDto) {
    return { data: await this.limpiezaService.patchMeta(id, dto.reproceso) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Patch('/limpiezas/:id/items/:key')
  async patchLimpiezaItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('key') key: string,
    @Body() dto: PatchLimpiezaItemDto,
  ) {
    return { data: await this.limpiezaService.patchItem(id, key, dto) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Post('/limpiezas/:id/finalizar')
  async finalizarLimpieza(@Param('id', ParseIntPipe) id: number, @Body() dto: CerrarIncompletoDto) {
    return { data: await this.limpiezaService.finalizar(id, dto.confirmarIncompleto) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.REVISAR])
  @Post('/limpiezas/:id/correcciones')
  async correccionLimpieza(@Param('id', ParseIntPipe) id: number, @Body() dto: CorreccionLimpiezaDto) {
    return {
      data: await this.limpiezaService.correccion(id, dto.motivo, dto.cambios, dto.reproceso),
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Delete('/limpiezas/:id')
  async deleteLimpieza(@Param('id', ParseIntPipe) id: number) {
    await this.limpiezaService.descartar(id);
    return { data: undefined };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Post('/ambulancias/:vehiculoId/dotaciones/iniciar')
  async iniciarDotacion(@Param('vehiculoId', ParseIntPipe) vehiculoId: number) {
    return { data: await this.dotacionService.iniciar(vehiculoId) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/dotaciones/grilla')
  async grillaDotaciones(@Query() query: DotacionGrillaQueryDto) {
    return {
      data: await this.dotacionService.buildGrillaMensual(
        query.mes,
        query.anio,
        query.vehiculoId,
        query.tipoAmbulancia,
      ),
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/dotaciones')
  async listarDotaciones(@Query() query: DotacionSearchQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, count] = await this.dotacionService.search({
      search: query.search,
      vehiculoId: query.vehiculoId,
      desde: query.desde,
      hasta: query.hasta,
      estado: query.estado,
      completa: query.completa,
      page,
      limit,
    });
    return PaginationHelper.response(items, count, page, limit);
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/dotaciones/:id')
  async getDotacion(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.dotacionService.getById(id) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Patch('/dotaciones/:id/items/:key')
  async patchDotacionItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('key') key: string,
    @Body() dto: PatchDotacionItemDto,
  ) {
    return { data: await this.dotacionService.patchItem(id, key, dto as any) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Post('/dotaciones/:id/cerrar')
  async cerrarDotacion(@Param('id', ParseIntPipe) id: number, @Body() dto: CerrarIncompletoDto) {
    return { data: await this.dotacionService.cerrar(id, dto.confirmarIncompleto) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Post('/dotaciones/:id/reabrir')
  async reabrirDotacion(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.dotacionService.reabrir(id) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.REVISAR])
  @Post('/dotaciones/:id/correcciones')
  async correccionDotacion(@Param('id', ParseIntPipe) id: number, @Body() dto: CorreccionDotacionDto) {
    return { data: await this.dotacionService.correccion(id, dto.motivo, dto.cambios as any) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Delete('/dotaciones/:id')
  async deleteDotacion(@Param('id', ParseIntPipe) id: number) {
    await this.dotacionService.eliminar(id);
    return { data: undefined };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/novedades')
  async listarNovedades(@Query('estado') estado?: string) {
    return { data: await this.novedadService.listar(estado as any) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.REVISAR])
  @Patch('/novedades/:id/resolver')
  async resolverNovedad(@Param('id', ParseIntPipe) id: number, @Body() dto: ResolverNovedadDto) {
    return { data: await this.novedadService.resolver(id, dto.observacion) };
  }
}
