import { BaseApiResponse } from "@common/domain/types";
import { BaseShelteredController } from "@common/presentation/controllers/base-sheltered.controller";
import { FilterSearchLimitedDto } from "@common/presentation/dto";
import { ResponsableService } from "@core/terceros/application/services";
import { ResponsableMapper } from "@core/terceros/infrastructure/mappers";
import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ResponseResponsableDto } from "../dto";


@Controller('v4/inn/responsables')
export class ResponsableController extends BaseShelteredController {
    constructor(private readonly responsableService: ResponsableService) {
        super();
    }

    @Get()
    public async getAll(
        @Query() { search, limit }: FilterSearchLimitedDto
    ): Promise<BaseApiResponse<ResponseResponsableDto[]>> {
        const proveedoresFound = await this.responsableService.findAll(search, limit);
        return { data: proveedoresFound.map(resp => ResponsableMapper.toResponse(resp)) };
    }
}
