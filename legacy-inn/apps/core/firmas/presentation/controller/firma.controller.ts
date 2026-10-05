import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { FirmaService } from '@core/firmas';
import { FirmaMapper } from '@core/firmas/infrastructure/mappers';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { TipoFirmante } from '@orm/cor';
import { CreateFirmaDto, ResponseFirmaDto, UpdateFirmaDto } from '../dto';

@Controller('v4/inn/firmas')
export class FirmaController extends BaseShelteredController {
  constructor(private readonly firmaService: FirmaService) {
    super();
  }

  @Post()
  public async create(@Body() data: CreateFirmaDto): Promise<BaseApiResponse<ResponseFirmaDto>> {
    const firma = await this.firmaService.create(data);
    return { data: FirmaMapper.toResponse(firma) };
  }

  @Patch('/:id')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateFirmaDto
  ): Promise<BaseApiResponse<ResponseFirmaDto>> {
    const firma = await this.firmaService.update(id, data);
    return { data: FirmaMapper.toResponse(firma) };
  }

  @Get('firmante/:tipo/:id')
  public async findByFirmante(
    @Param('tipo') tipo: TipoFirmante,
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<ResponseFirmaDto>> {
    const firma = await this.firmaService.findByFirmante(id, tipo);
    return { data: FirmaMapper.toResponse(firma) };
  }
}
