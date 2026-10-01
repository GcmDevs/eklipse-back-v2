import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { TipoActivoService } from '@equipos/application';
import { TipoActivoRead } from '@equipos/domain/read';
import { CreateTipoActivoDto, FilterTipoActivoDto, UpdateTipoActivoDto } from '@equipos/presentation/dto';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

@Controller('/v4/inn/tipos-activo')
export class TipoActivoController extends BaseShelteredController {
  constructor(private readonly service: TipoActivoService) {
    super();
  }

  @Post()
  async create(@Body() data: CreateTipoActivoDto): Promise<BaseApiResponse<TipoActivoRead>> {
    const entity = await this.service.create(data);
    return { data: entity };
  }

  @Get()
  async getAll(@Query() filters: FilterTipoActivoDto): Promise<BaseApiResponse<TipoActivoRead[]>> {
    const list = await this.service.findAll(filters);
    return { data: list };
  }

  @Patch('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTipoActivoDto,
  ): Promise<BaseApiResponse<TipoActivoRead>> {
    const entity = await this.service.update(id, data);
    return { data: entity };
  }

  @Patch('/:id/activar')
  async activate(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<void>> {
    await this.service.activate(id);
    return { message: 'activado con exito' };
  }

  @Patch('/:id/desactivar')
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<void>> {
    await this.service.deactivate(id);
    return { message: 'desactivado con exito' };
  }
}