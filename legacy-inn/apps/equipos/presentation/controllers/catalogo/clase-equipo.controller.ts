import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { ClaseEquipoService } from '@equipos/application';
import { ClaseEquipoRead, SubclaseEquipoRead } from '@equipos/domain/read';
import {
  CreateClaseEquipoDto,
  CreateSubclaseEquipoDto,
  UpdateClaseEquipoDto,
  UpdateSubclaseEquipoDto
} from '@equipos/presentation/dto';
import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

@Controller('/v4/inn/clases-equipo')
export class ClaseEquipoController extends BaseShelteredController {
  constructor(private readonly service: ClaseEquipoService) {
    super();
  }

  @Post()
  async createClase(@Body() data: CreateClaseEquipoDto): Promise<BaseApiResponse<ClaseEquipoRead>> {
    const entity = await this.service.createClase(data);
    return { data: entity };
  }

  @Get()
  async getAllClases(@Query(
    'tipoActivoId',
    new ParseIntPipe({
      exceptionFactory: () =>
        new BadRequestException('El parámetro tipoActivoId es obligatorio y debe ser un número.'),
    }),
  )
  tipoActivoId: number,): Promise<BaseApiResponse<ClaseEquipoRead[]>> {
    const list = await this.service.findAllClases(tipoActivoId);
    return { data: list };
  }

  @Patch('/:claseId')
  async updateClase(
    @Param('claseId', ParseIntPipe) claseId: number,
    @Body() data: UpdateClaseEquipoDto,
  ): Promise<BaseApiResponse<ClaseEquipoRead>> {
    const entity = await this.service.updateClase(claseId, data);
    return { data: entity };
  }

  @Patch('/:claseId/desactivar')
  async desactivarClase(@Param('claseId', ParseIntPipe) claseId: number): Promise<BaseApiResponse<void>> {
    await this.service.desactivarClase(claseId);
    return { data: undefined };
  }

  @Post('/:claseId/subclases')
  async createSubclase(
    @Param('claseId', ParseIntPipe) claseId: number,
    @Body() data: CreateSubclaseEquipoDto,
  ): Promise<BaseApiResponse<SubclaseEquipoRead>> {
    const entity = await this.service.createSubclase(claseId, data);
    return { data: entity };
  }

  @Get('/:claseId/subclases')
  async getAllSubclases(
    @Param('claseId', ParseIntPipe) claseId: number,
  ): Promise<BaseApiResponse<SubclaseEquipoRead[]>> {
    const list = await this.service.findAllSubclases(claseId);
    return { data: list };
  }

  @Patch('/:claseId/subclases/:subclaseId')
  async updateSubclase(
    @Param('claseId', ParseIntPipe) claseId: number,
    @Param('subclaseId', ParseIntPipe) subclaseId: number,
    @Body() data: UpdateSubclaseEquipoDto,
  ): Promise<BaseApiResponse<SubclaseEquipoRead>> {
    const entity = await this.service.updateSubclase(claseId, subclaseId, data);
    return { data: entity };
  }

  @Patch('/:claseId/subclases/:subclaseId/desactivar')
  async desactivarSubclase(
    @Param('claseId', ParseIntPipe) claseId: number,
    @Param('subclaseId', ParseIntPipe) subclaseId: number,
  ): Promise<BaseApiResponse<void>> {
    await this.service.desactivarSubclase(claseId, subclaseId);
    return { data: undefined };
  }
}
