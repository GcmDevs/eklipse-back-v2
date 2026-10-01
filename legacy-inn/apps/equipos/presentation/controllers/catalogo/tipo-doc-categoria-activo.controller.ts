import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { TipoDocCategoriaActivoService } from '@equipos/application';
import { TipoDocCategoriaActivoRead } from '@equipos/domain/read';
import {
  CreateTipoDocCategoriaActivoDto,
  FilterTipoDocCategoriaActivoDto,
  ReplaceTipoDocCategoriaActivoDto,
} from '@equipos/presentation/dto';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';

@Controller('/v4/inn/tipos-doc-categoria')
export class TipoDocCategoriaActivoController extends BaseShelteredController {
  constructor(private readonly service: TipoDocCategoriaActivoService) {
    super();
  }

  @Post()
  async create(@Body() data: CreateTipoDocCategoriaActivoDto): Promise<BaseApiResponse<TipoDocCategoriaActivoRead>> {
    const tipoDoc = await this.service.create(data);
    return { data: tipoDoc };
  }

  @Get()
  async getAll(
    @Query() filters: FilterTipoDocCategoriaActivoDto,
  ): Promise<BaseApiResponse<TipoDocCategoriaActivoRead[]>> {
    const list = await this.service.findAll(filters);
    return { data: list };
  }

  @Put('/:id')
  async replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ReplaceTipoDocCategoriaActivoDto,
  ): Promise<BaseApiResponse<TipoDocCategoriaActivoRead>> {
    const entity = await this.service.replace(id, data);
    return { data: entity };
  }
}
