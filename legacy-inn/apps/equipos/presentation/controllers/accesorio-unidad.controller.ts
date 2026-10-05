import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { AccesorioUnidadService } from '@equipos/application';
import { AccesorioUnidadRead } from '@equipos/domain/read';
import {
  ChangeEstadoAccesorioUnidadDto,
  UpdateObservacionesAccesorioUnidadDto,
} from '@equipos/presentation/dto';
import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';

@Controller('/v4/inn/equipos/:equipoId/accesorios')
export class AccesorioUnidadController extends BaseShelteredController {
  constructor(private readonly service: AccesorioUnidadService) {
    super();
  }

  @Get()
  async getByEquipo(
    @Param('equipoId', ParseIntPipe) equipoId: number
  ): Promise<BaseApiResponse<AccesorioUnidadRead[]>> {
    const list = await this.service.findByEquipoId(equipoId);
    return { data: list };
  }

  @Patch('/:id/cambiar-estado')
  async changeEstado(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ChangeEstadoAccesorioUnidadDto
  ): Promise<BaseApiResponse<AccesorioUnidadRead>> {
    const entity = await this.service.changeEstado(equipoId, id, data.estado);
    return { data: entity };
  }

  @Patch('/:id')
  async update(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateObservacionesAccesorioUnidadDto
  ): Promise<BaseApiResponse<AccesorioUnidadRead>> {
    const entity = await this.service.update(equipoId, id, data.observaciones);
    return { data: entity };
  }

  @Patch('/:id/descontinuar')
  async descontinuar(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<AccesorioUnidadRead>> {
    const entity = await this.service.discontinue(equipoId, id);
    return { data: entity };
  }
}
