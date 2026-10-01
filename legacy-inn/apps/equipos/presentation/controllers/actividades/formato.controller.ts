import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers/base-sheltered.controller';
import { FilterSearchPaginatedDto, PaginationDto } from '@common/presentation/dto';
import { PaginationHelper } from '@common/presentation/helpers';
import { FormatoService } from '@equipos/application';
import { FormatoRead } from '@equipos/domain/read';
import { FilterFormatoDto } from '@equipos/presentation/dto';
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

@Controller('/v4/inn/fmts')
export class FormatoController extends BaseShelteredController {
  constructor(private readonly formatoService: FormatoService) {
    super();
  }

  @Get('/:id')
  public async getOneById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<FormatoRead>> {
    const formato = await this.formatoService.getOneById(id);
    return { data: formato };
  }

  @Get()
  public async getAll(
    @Query() { page, limit, search, ...filters }: FilterFormatoDto
  ): Promise<BaseApiResponse<FormatoRead[]>> {
    const [formatos, count] = await this.formatoService.getAll({ page, limit, search, ...filters });
    return PaginationHelper.response(
      formatos,
      count,
      page,
      limit,
    );
  }
}
