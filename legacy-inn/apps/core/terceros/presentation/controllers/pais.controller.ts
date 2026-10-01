import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { PaisService } from '@core/terceros/application/services/pais.service';
import { Controller, Get, Query } from '@nestjs/common';
import { FilterPaisDto, ResponsePaisDto } from '../dto';
import { PaisMapper } from '@core/terceros/infrastructure/mappers';


@Controller('/v4/inn/paises')
export class PaisController extends BaseShelteredController {
    constructor(
        private readonly paisService: PaisService) { super();}

    @Get()
    async getAll(@Query() { search, limit }: FilterPaisDto): Promise<BaseApiResponse<ResponsePaisDto>> {
        const data = await this.paisService.getAll(search, limit);
        return { data: PaisMapper.toResponseList(data) };
    }
}
