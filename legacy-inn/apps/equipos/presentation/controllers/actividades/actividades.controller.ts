import { INN_AUTHORITIES } from '@authorities/inventario';
import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Authorities } from '@common/presentation/decorators';
import { PaginationHelper } from '@common/presentation/helpers';
import { AddAnexosDto } from '@core/media/presentation/dto';
import { ActividadesService } from '@equipos/application';
import { TipoActividad } from '@equipos/domain/enums';
import { AsignacionRecursoActividadRead, RegistroActividadRead } from '@equipos/domain/read';
import {
  AssingRecursoActividadDto,
  CompleteActividadProgramadaDto,
  CreateRegistroActividadDto,
  CreateReprogramacionActividadDto,
  FilterRegistroActividadDto,
  MotivoFinalizacionAsignacionActividadDto,
} from '@equipos/presentation/dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

@Controller('/v4/inn/equipos/actividades')
export class ActividadesController extends BaseShelteredController {
  constructor(private readonly actividadesService: ActividadesService) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.EJECUTAR])
  @Post()
  async create(
    @Body() data: CreateRegistroActividadDto
  ): Promise<BaseApiResponse<RegistroActividadRead>> {
    const saved = await this.actividadesService.createInmediato(data);
    return {
      data: saved,
      message: `${TipoActividad[data.tipo]} registrado exitosamente`,
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.EJECUTAR])
  @Patch('/:id/completar')
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CompleteActividadProgramadaDto
  ): Promise<BaseApiResponse<RegistroActividadRead>> {
    const saved = await this.actividadesService.completeProgramado(id, data);
    return {
      data: saved,
      message: `${TipoActividad[data.tipo]} completado exitosamente`,
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.CHEQUEAR])
  @Patch('/:id/revisar')
  @HttpCode(200)
  async check(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<RegistroActividadRead>> {
    const saved = await this.actividadesService.check(id);
    return { data: saved, message: 'Actividad chequeada exitosamente' };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.REPROGRAMAR])
  @Post('/:id/reprogramar')
  async reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateReprogramacionActividadDto
  ): Promise<BaseApiResponse<RegistroActividadRead>> {
    const saved = await this.actividadesService.reschedule(id, data);
    return {
      data: saved,
      message: `${TipoActividad[data.tipo]} reprogramado exitosamente`,
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.EJECUTAR])
  @Post('/:id/anexos')
  async addAnexos(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AddAnexosDto
  ): Promise<BaseApiResponse<RegistroActividadRead>> {
    const saved = await this.actividadesService.addAnexosRegistro(id, data);
    return {
      data: saved,
      message: `${data.anexos.length} anexo(s) agregado(s) exitosamente`,
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.EJECUTAR])
  @Post('/:id/ejecucion-externa/anexos')
  async addAnexosEjecucionExterna(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AddAnexosDto
  ): Promise<BaseApiResponse<void>> {
    await this.actividadesService.addAnexosEjecucionExterna(id, data);
    return { message: `${data.anexos.length} anexo(s) agregado(s) a la ejecución externa` };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.VER])
  @Get()
  async getAll(
    @Query() { page, limit, ...filters }: FilterRegistroActividadDto
  ): Promise<BaseApiResponse<RegistroActividadRead[]>> {
    const [registros, count] = await this.actividadesService.getAll({ page, limit, ...filters });
    return PaginationHelper.response(registros, count, page, limit);
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.VER])
  @Get('/by-equipo/:equipoId')
  async getAllByEquipo(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Query() { page, limit, ...filters }: FilterRegistroActividadDto
  ): Promise<BaseApiResponse<RegistroActividadRead[]>> {
    const [registros, count] = await this.actividadesService.getAll({
      page,
      limit,
      equipoId,
      ...filters,
    });
    return PaginationHelper.response(registros, count, page, limit);
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.VER])
  @Get('/:id')
  async getOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<RegistroActividadRead>> {
    const found = await this.actividadesService.getOneById(id);
    return { data: found };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.RECURSOS.ASIGNAR_A_ACTIVIDAD])
  @Post('/:id/recursos/asignar')
  async assingActividad(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AssingRecursoActividadDto
  ): Promise<BaseApiResponse<RegistroActividadRead>> {
    const updated = await this.actividadesService.assingRecurso(id, data);
    return { data: updated, message: 'Recurso asignado a la actividad' };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.RECURSOS.ASIGNAR_A_ACTIVIDAD])
  @Patch('/:id/recursos/remover')
  @HttpCode(200)
  async removeDeActividad(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MotivoFinalizacionAsignacionActividadDto
  ): Promise<BaseApiResponse<RegistroActividadRead>> {
    const updated = await this.actividadesService.removeRecurso(id, dto);
    return { data: updated, message: 'Recurso removido de la actividad' };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.RECURSOS.GESTIONAR])
  @Get('/:id/recursos/historial')
  async historialActividad(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<AsignacionRecursoActividadRead[]>> {
    const historial = await this.actividadesService.getHistorialRecursos(id);
    return { data: historial };
  }
}
