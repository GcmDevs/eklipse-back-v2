import { INN_AUTHORITIES } from '@authorities/inventario';
import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers/base-sheltered.controller';
import { Authorities } from '@common/presentation/decorators';
import { PaginationHelper } from '@common/presentation/helpers';
import { EquiposLegacyService, EquiposService } from '@equipos/application';
import { SolicitudService } from '@equipos/application/services/solicitud.service';
import { TipoAccionAprobacion, TipoActividad } from '@equipos/domain/enums';
import { EquipoRead, ResumenEquiposRead } from '@equipos/domain/read';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { HasDirectAuthority } from '../decorators/is-admin.decorator';
import {
  ChangeEstadoSolicitudDto,
  CreateEquipoDto,
  DarDeBajaEquipoDto,
  FilterEquipoDto,
  FilterResumenEquipoDto,
  ImportEquipoLegacyDto,
  ResponseGeneralActivoLegacyEnrichedDto,
  UpdateEquipoDto,
  UpdatePlanActividadDto,
} from '../dto';

@Controller('/v4/inn/equipos')
export class EquiposController extends BaseShelteredController {
  constructor(
    private readonly equipoService: EquiposService,
    private readonly equiposLegacyService: EquiposLegacyService,
    private readonly solicitudesService: SolicitudService
  ) {
    super();
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.CREAR,
  ])
  @Post()
  public async create(@Body() data: CreateEquipoDto): Promise<BaseApiResponse<EquipoRead>> {
    const equipoSaved = await this.equipoService.create(data);
    return {
      data: equipoSaved,
      message: 'Equipo creado exitosamente',
    };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.CREAR,
  ])
  @Post('/import-legacy')
  public async importLegacy(
    @Body() data: ImportEquipoLegacyDto
  ): Promise<BaseApiResponse<EquipoRead>> {
    const equipoSaved = await this.equiposLegacyService.importEquipoLegacy(data);
    return {
      data: equipoSaved,
      message: 'Equipo importado exitosamente',
    };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.VER,
  ])
  @Get()
  public async getAll(
    @Query() { page, limit, ...filters }: FilterEquipoDto
  ): Promise<BaseApiResponse<EquipoRead[]>> {
    const [equipos, count] = await this.equipoService.getAll({ page, limit, ...filters });
    return PaginationHelper.response(equipos, count, page, limit);
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.VER,
  ])
  @Get('/resumen')
  public async getResumen(
    @Query() filters: FilterResumenEquipoDto
  ): Promise<BaseApiResponse<ResumenEquiposRead>> {
    const resumen = await this.equipoService.getResumen(filters);
    return { data: resumen };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.VER,
  ])
  @Get('/general-activo/:numPlaca')
  public async getOneGeneralActivoByNumeroPlaca(
    @Param('numPlaca') numPlaca: string
  ): Promise<BaseApiResponse<ResponseGeneralActivoLegacyEnrichedDto>> {
    const activoGralFound = await this.equiposLegacyService.getGeneralActivoByNumeroPlaca(numPlaca);
    return { data: activoGralFound };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.VER,
  ])
  @Get('/:id')
  public async getOne(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<EquipoRead>> {
    const equipoFound = await this.equipoService.getOneById(id);
    return { data: equipoFound };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.VER,
  ])
  @Get('/by-placa/:numeroPlaca')
  public async getOneByPlaca(
    @Param('numeroPlaca') numeroPlaca: string
  ): Promise<BaseApiResponse<EquipoRead>> {
    const equipoFound = await this.equipoService.getOneByPlaca(numeroPlaca);
    return { data: equipoFound };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.VER,
  ])
  @Patch('/:id')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipoData: UpdateEquipoDto
  ): Promise<BaseApiResponse<EquipoRead>> {
    const equipoUpdated = await this.equipoService.update(id, updateEquipoData);
    return {
      data: equipoUpdated,
      message: 'Equipo actualizado exitosamente',
    };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.EDITAR,
  ])
  @Patch('update/plan-mantenimiento/:id')
  public async updatePlanMantenimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanActividadDto: UpdatePlanActividadDto
  ): Promise<BaseApiResponse<EquipoRead>> {
    const equipoUpdated = await this.equipoService.updatePlan(
      id,
      TipoActividad.MANTENIMIENTO,
      updatePlanActividadDto
    );
    return {
      data: equipoUpdated,
      message: `Plan de mantenimiento del equipo fue actualizado correctamente`,
    };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.EDITAR,
  ])
  @Patch('update/plan-calibracion/:id')
  public async updatePlanCalibracion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanActividadDto: UpdatePlanActividadDto
  ): Promise<BaseApiResponse<EquipoRead>> {
    const equipoUpdated = await this.equipoService.updatePlan(
      id,
      TipoActividad.CALIBRACION,
      updatePlanActividadDto
    );
    return {
      data: equipoUpdated,
      message: `Plan de calibracion del equipo fue actualizado correctamente`,
    };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.CAMBIAR_ESTADO_DIRECTO,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.CAMBIAR_ESTADO,
  ])
  @Patch('/:equipoId/cambiar-estado')
  async changeEstado(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Body() data: ChangeEstadoSolicitudDto,
    @HasDirectAuthority(INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.CAMBIAR_ESTADO_DIRECTO)
    directAccess: boolean
  ): Promise<BaseApiResponse<{ autoaprobada: boolean; solicitudId?: number }>> {
    const result = await this.solicitudesService.process({
      equipoId,
      tipoAccion: TipoAccionAprobacion.CAMBIO_ESTADO,
      directaAccess: directAccess,
      payload: data,
    });
    return {
      data: result,
      message: result.autoaprobada
        ? 'Estado cambiado con exito'
        : 'Solicitud pendiente de aprobación',
    };
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.CAMBIAR_ESTADO_DIRECTO,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.CAMBIAR_ESTADO,
  ])
  @Patch('/:equipoId/dar-baja')
  async darDeBaja(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Body() data: DarDeBajaEquipoDto,
    @HasDirectAuthority(INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.CAMBIAR_ESTADO_DIRECTO)
    directAccess: boolean
  ): Promise<BaseApiResponse<{ autoaprobada: boolean; solicitudId?: number }>> {
    const result = await this.solicitudesService.process({
      equipoId,
      tipoAccion: TipoAccionAprobacion.DAR_DE_BAJA,
      directaAccess: directAccess,
      payload: {
        archivoActaId: data.archivoActaId,
        motivo: data.motivo,
        observaciones: data.observaciones,
        fechaBaja: data.fechaBaja,
      },
    });
    return {
      data: result,
      message: result.autoaprobada ? 'Equipo dado de baja' : 'Solicitud pendiente de aprobación',
    };
  }
}
