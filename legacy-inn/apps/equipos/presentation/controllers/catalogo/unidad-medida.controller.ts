import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers/base-sheltered.controller';
import { UnidadMedidaService } from '@equipos/application';
import { UnidadMedidaMapper } from '@equipos/infrastructure';
import { ResponseUnidadMedidaDto } from '@equipos/presentation/dto';
import { Controller, Get } from '@nestjs/common';

@Controller('/v4/inn/unidad-medida')
export class UnidadMedidaController extends BaseShelteredController {
  constructor(private readonly unidadMedidaService: UnidadMedidaService) {
    super();
  }

  @Get()
  public async getAll(): Promise<BaseApiResponse<ResponseUnidadMedidaDto[]>> {
    const unidadesMedidaFound = await this.unidadMedidaService.getAll();
    const responseUnidadesMedida = unidadesMedidaFound.map(UnidadMedidaMapper.toResponse);
    return { data: responseUnidadesMedida };
  }
}
