import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { FilterSearchPaginatedDto } from '@common/presentation/dto';
import { PaginationHelper } from '@common/presentation/helpers';
import { MarcaService } from '@equipos/application';
import { MarcaRead } from '@equipos/domain/read';
import { CreateMarcaDto } from '@equipos/presentation/dto';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';

@Controller('/v4/inn/marcas')
export class MarcaController extends BaseShelteredController {
  constructor(private readonly marcaService: MarcaService) {
    super();
  }

  @Post()
  public async create(@Body() data: CreateMarcaDto): Promise<BaseApiResponse<MarcaRead>> {
    const marcaSaved = await this.marcaService.create(data);
    return { data: marcaSaved };
  }

  @Get()
  public async getAll(
    @Query() { page, limit, search }: FilterSearchPaginatedDto
  ): Promise<BaseApiResponse<MarcaRead[]>> {
    const [marcas, count] = await this.marcaService.getAll({ page, limit, search });
    return PaginationHelper.response(marcas, count, page, limit);
  }
}
