import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { PaginationHelper } from '@common/presentation/helpers';
import { MunicipioService } from '@core/gen/application/services';
import { Controller, Get, Query } from '@nestjs/common';
import { FilterMunicipioDto, MunicipioRead } from '../dto';

@Controller('/v4/inn/municipios')
export class MunicipioController extends BaseShelteredController {
  constructor(private readonly municipioService: MunicipioService) {
    super();
  }

  @Get()
  async getAll(
    @Query() { page, limit, search, departamentoId }: FilterMunicipioDto
  ): Promise<BaseApiResponse<MunicipioRead[]>> {
    const [items, count] = await this.municipioService.getAll(page, limit, search, {
      departamentoId,
    });
    return PaginationHelper.response(items, count, page, limit);
  }
}
