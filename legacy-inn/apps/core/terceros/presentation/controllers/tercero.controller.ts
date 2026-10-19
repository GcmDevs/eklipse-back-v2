import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { TerceroService } from '@core/terceros/application/services/tercero.service';
import { TerceroMapper } from '@core/terceros/infrastructure/mappers';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateTerceroDto, ResponseTerceroDto, FilterTerceroDto } from '../dto';

@Controller('v4/inn/terceros')
export class TerceroController extends BaseShelteredController {
  constructor(private readonly terceroService: TerceroService) {
    super();
  }

  @Post()
  public async create(
    @Body() data: CreateTerceroDto
  ): Promise<BaseApiResponse<ResponseTerceroDto>> {
    const tercero = await this.terceroService.create(data);
    return {
      data: TerceroMapper.toResponse(tercero),
    };
  }

  @Get()
  public async getAll(
    @Query()
    { search, rol, limit }: FilterTerceroDto
  ) {
    const data = await this.terceroService.getAll(search, rol, limit);
    return { data: TerceroMapper.toResponseList(data) };
  }
}
