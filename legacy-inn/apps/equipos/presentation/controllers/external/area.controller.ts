import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers/base-sheltered.controller';
import { AreaService } from '@equipos/application';
import { AreaMapper } from '@equipos/infrastructure';
import { FilterNombreAreaDto, ResponseAreaDto } from '@equipos/presentation/dto';
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';


@Controller('v4/inn/areas')
export class AreaController  extends BaseShelteredController {
  constructor(private readonly areaService: AreaService) {
    super();
  }

  @Get('/suggestions')
  public async getSuggestionsByNombre(
    @Query() { nombre, limit }: FilterNombreAreaDto
  ): Promise<BaseApiResponse<ResponseAreaDto[]>> {
    const areasFound = await this.areaService.getSuggestionsByNombre(nombre, limit);
    const areasResponse = areasFound.map(area => AreaMapper.toResponse(area));
    return { data: areasResponse };
  }

  
  @Get('/:id')
  public async getOneById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<ResponseAreaDto>> {
    const areaFound = await this.areaService.getOneById(id);
    return { data: AreaMapper.toResponse(areaFound) };
  }
}
