import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { ModeloService } from '@equipos/application';
import { ModeloRead } from '@equipos/domain/read';
import { CreateModeloDto, FilterModeloDto } from '@equipos/presentation/dto';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

@Controller('/v4/inn/modelos')
export class ModeloController extends BaseShelteredController {
  constructor(private readonly modeloService: ModeloService) {
    super();
  }

  @Post()
  public async create(
    @Body() createModeloDto: CreateModeloDto
  ): Promise<BaseApiResponse<ModeloRead>> {
    const modeloSaved = await this.modeloService.create(createModeloDto);
    return { data: modeloSaved, message: 'Modelo creado exitosamente' };
  }

  @Get()
  public async getAllByMarca(
    @Query() { search, marcaId }: FilterModeloDto
  ): Promise<BaseApiResponse<ModeloRead[]>> {
    const modelos = await this.modeloService.getAllByMarca(marcaId, search);
    return { data: modelos };
  }
}
