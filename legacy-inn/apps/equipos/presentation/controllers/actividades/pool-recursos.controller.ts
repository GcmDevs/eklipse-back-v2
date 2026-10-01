import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { RecursoService } from '@equipos/application';
import { RecursoAsignacionTecnicoRead, RecursoRead } from '@equipos/domain/read';
import {
  AssingUsuarioTecnicoRecursoDto,
  CreateRecursoDto,
  MotivoFinalizacionAsignacionTecnicoRecursoDto,
} from '@equipos/presentation/dto';
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

@Controller('/v4/inn/pool-recursos')
export class RecursoController extends BaseShelteredController {
  constructor(private readonly recursoService: RecursoService) {
    super();
  }

  @Post()
  async create(@Body() dto: CreateRecursoDto): Promise<BaseApiResponse<RecursoRead>> {
    const recurso = await this.recursoService.create(dto);
    return { data: recurso, message: 'Recurso creado exitosamente' };
  }

  @Post('/:id/tecnicos/asignar')
  @HttpCode(200)
  async asignarTecnico(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssingUsuarioTecnicoRecursoDto
  ): Promise<BaseApiResponse<RecursoRead>> {
    const updated = await this.recursoService.assingTecnico(id, dto);
    return {
      data: updated,
      message: 'Tecnico asignado al recurso',
    };
  }

  @Patch('/:id/tecnicos/remover')
  @HttpCode(200)
  async removeTecnico(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: MotivoFinalizacionAsignacionTecnicoRecursoDto
  ): Promise<BaseApiResponse<RecursoRead>> {
    const updated = await this.recursoService.removeTecnico(id, dto);

    return {
      data: updated,
      message: 'Tecnico removido del recurso',
    };
  }

  @Patch('/:id/desactivar')
  @HttpCode(200)
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<RecursoRead>> {
    const updated = await this.recursoService.deactivate(id);
    return { data: updated, message: 'Recurso desactivado' };
  }

  @Patch('/:id/activar')
  @HttpCode(200)
  async reactivate(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<RecursoRead>> {
    const updated = await this.recursoService.reactivate(id);
    return { data: updated, message: 'Recurso reactivado' };
  }

  @Get()
  async getAll(): Promise<BaseApiResponse<RecursoRead[]>> {
    const list = await this.recursoService.findAll();
    return { data: list };
  }

  @Get('/:id/tecnicos/historial')
  async historialAsignaciones(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<RecursoAsignacionTecnicoRead[]>> {
    const historial = await this.recursoService.getHistorialAsignaciones(id);
    return { data: historial };
  }
}
