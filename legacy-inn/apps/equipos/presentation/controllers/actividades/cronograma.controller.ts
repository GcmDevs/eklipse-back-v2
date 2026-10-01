import { BaseApiResponse } from "@common/domain/types";
import { BaseShelteredController } from "@common/presentation/controllers";
import { CronogramaService } from "@equipos/application";
import { CronogramaRead } from "@equipos/domain/read";
import { CreateCronogramaDto, FilterCronogramaDto, UpdateCronogramaDto } from "@equipos/presentation/dto";
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";

@Controller('/v4/inn/equipos/actividades/cronogramas')
export class CronogramaController extends BaseShelteredController {
    constructor(private readonly cronogramaService: CronogramaService) {
        super();
    }

    @Post()
    async create(
        @Body() dto: CreateCronogramaDto
    ): Promise<BaseApiResponse<CronogramaRead>> {
        const saved = await this.cronogramaService.create(dto);
        return {
            data: saved,
            message: `Cronograma ${dto.tipo} ${dto.mes}/${dto.anio} creado exitosamente`,
        };
    }

    @Patch('/:id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCronogramaDto,
    ): Promise<BaseApiResponse<CronogramaRead>> {
        const updated = await this.cronogramaService.update(id, dto);
        return { data: updated, message: 'Cronograma actualizado' };
    }

    @Patch('/:id/cerrar')
    @HttpCode(200)
    async close(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseApiResponse<CronogramaRead>> {
        const updated = await this.cronogramaService.close(id);
        return { data: updated, message: 'Cronograma cerrado exitosamente' };
    }

    @Patch('/:id/anular')
    @HttpCode(200)
    async annul(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseApiResponse<CronogramaRead>> {
        const updated = await this.cronogramaService.annul(id);
        return { data: updated, message: 'Cronograma anulado' };
    }

    @Get()
    async getAll(
        @Query() filters: FilterCronogramaDto,
    ): Promise<BaseApiResponse<CronogramaRead[]>> {
        const list = await this.cronogramaService.findAll(filters);
        return { data: list };
    }

    @Get('/:id')
    async getOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseApiResponse<CronogramaRead>> {
        const found = await this.cronogramaService.getById(id);
        return { data: found };
    }
}
