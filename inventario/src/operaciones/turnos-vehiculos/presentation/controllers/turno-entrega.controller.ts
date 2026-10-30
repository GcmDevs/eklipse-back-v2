import { INN_AUTHORITIES } from '@inn/authorities';
import { BadInputError } from '@common/domain/errors';
import { BaseApiResponse } from '@common/domain/types';
import { Authorities } from '@common/presentation/decorators';
import { BaseShelteredController } from '@common/presentation/controllers';
import { PaginationHelper } from '@common/presentation/helpers';
import { RolDeclaracion } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { parseRolDeclaracion } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import { MiTurnoView, TableroView, TurnoDetalleView, TurnoView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { EntregaService } from '@inn/operaciones/turnos-vehiculos/application/services/entrega.service';
import { TableroService } from '@inn/operaciones/turnos-vehiculos/application/services/tablero.service';
import { TurnoService } from '@inn/operaciones/turnos-vehiculos/application/services/turno.service';
import { MiTurnoService } from '@inn/operaciones/turnos-vehiculos/application/services/mi-turno.service';
import { FlotaAdminService } from '@inn/operaciones/turnos-vehiculos/application/services/flota-admin.service';
import { AmbEventoService } from '@inn/operaciones/turnos-vehiculos/application/services/amb-evento.service';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import {
  AdminExtenderPlazoDto,
  AdminMotivoDto,
  AdminTransferirDto,
  CerrarIncompletoDto,
  CorreccionEntregaDto,
  CreateTurnoDto,
  PatchEntregaItemDto,
} from '../dto/flota.dto';
import { TurnoSearchQueryDto } from '../dto/flota-search.dto';

@Controller('/v4/inn/amb')
export class TurnoEntregaController extends BaseShelteredController {
  constructor(
    private readonly turnoService: TurnoService,
    private readonly tableroService: TableroService,
    private readonly entregaService: EntregaService,
    private readonly miTurnoService: MiTurnoService,
    private readonly adminService: FlotaAdminService,
    private readonly eventoService: AmbEventoService,
  ) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/tablero')
  async tablero(): Promise<BaseApiResponse<TableroView>> {
    return { data: await this.tableroService.obtener() };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/mi-turno')
  async miTurno(): Promise<BaseApiResponse<MiTurnoView>> {
    return { data: await this.miTurnoService.obtener() };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Post('/turnos')
  async crear(@Body() data: CreateTurnoDto) {
    return { data: await this.turnoService.iniciarTurno(data.vehiculoId) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/turnos')
  async listar(@Query() turnoSearch: TurnoSearchQueryDto) {
    const page = turnoSearch.page ?? 1;
    const limit = turnoSearch.limit ?? 20;
    const [items, count] = await this.turnoService.search({
      search: turnoSearch.search,
      vehiculoId: turnoSearch.vehiculoId,
      estado: turnoSearch.estado,
      desde: turnoSearch.desde,
      hasta: turnoSearch.hasta,
      page,
      limit,
    });
    return PaginationHelper.response<TurnoView>(items, count, page, limit);
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/turnos/:id')
  async getTurno(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<TurnoDetalleView>> {
    return { data: await this.miTurnoService.detalleTurno(id) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Post('/turnos/:id/admin/lanzar-entrega')
  async adminLanzar(@Param('id', ParseIntPipe) id: number, @Body() data: AdminMotivoDto) {
    return { data: await this.adminService.lanzarEnNombre(id, data.motivo) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Post('/turnos/:id/admin/transferir')
  async adminTransferir(@Param('id', ParseIntPipe) id: number, @Body() data: AdminTransferirDto) {
    return { data: await this.adminService.transferir(id, data.nuevoResponsableId, data.motivo) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Post('/turnos/:id/admin/cerrar')
  async adminCerrar(@Param('id', ParseIntPipe) id: number, @Body() data: AdminMotivoDto) {
    return { data: await this.adminService.cerrarTurno(id, data.motivo) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Post('/admin/plazos/extender')
  async adminExtender(@Body() data: AdminExtenderPlazoDto) {
    return { data: await this.adminService.extenderPlazo(data.recurso, data.id, data.minutos, data.motivo) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Post('/turnos/:id/entrega/lanzar')
  async lanzar(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.entregaService.lanzar(id) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/entregas/:id')
  async getEntrega(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.entregaService.getEntrega(id) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Post('/entregas/:id/recepcion')
  async recepcion(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.entregaService.iniciarRecepcion(id) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Patch('/entregas/:id/declaraciones/:rol/items/:key')
  async patchItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('rol') rol: string,
    @Param('key') key: string,
    @Body() dto: PatchEntregaItemDto,
  ) {
    const rolEnum = parseRolDeclaracion(rol);
    return { data: await this.entregaService.patchItem(id, rolEnum, key, dto) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Post('/entregas/:id/declaraciones/:rol/cerrar')
  async cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Param('rol') rol: string,
    @Body() dto: CerrarIncompletoDto,
  ) {
    const rolEnum = parseRolDeclaracion(rol);
    return { data: await this.entregaService.cerrarDeclaracion(id, rolEnum, dto.confirmarIncompleto) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.REVISAR])
  @Post('/entregas/:id/declaraciones/:rol/correcciones')
  async correccion(
    @Param('id', ParseIntPipe) id: number,
    @Param('rol') rol: string,
    @Body() dto: CorreccionEntregaDto,
  ) {
    const rolEnum = parseRolDeclaracion(rol);
    return {
      data: await this.entregaService.correccionDeclaracion(id, rolEnum, dto.motivo, dto.cambios),
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/eventos')
  async eventos(@Query('entidad') entidad: string, @Query('entidadId', ParseIntPipe) entidadId: number) {
    if (!entidad?.trim()) throw new BadInputError('entidad y entidadId son obligatorios');
    return { data: await this.eventoService.listar(entidad, entidadId) };
  }
}
