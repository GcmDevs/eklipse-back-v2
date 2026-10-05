import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { PartesCatgService } from '@equipos/application';
import { ParteCatgRead } from '@equipos/domain/read';
import { FilterParteDto } from '@equipos/presentation/dto';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('/v4/inn/equipos/partes-catg')
export class PartesCatgController extends BaseShelteredController {
  constructor(private readonly partesCatgService: PartesCatgService) {
    super();
  }

  @Get()
  async getAll(
    @Query() { limit, parte }: FilterParteDto
  ): Promise<BaseApiResponse<ParteCatgRead[]>> {
    const partes = await this.partesCatgService.findAll(limit, parte);
    return { data: partes };
  }
}
