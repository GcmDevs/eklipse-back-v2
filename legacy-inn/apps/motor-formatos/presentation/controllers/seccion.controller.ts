import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { SeccionesService } from 'apps/motor-formatos/application';
import { SeccionPlantillaFmtRead } from 'apps/motor-formatos/domain';
import { SeccionAnexosMapper } from 'apps/motor-formatos/infrastructure/mappers';
import { CreateSeccionPlantillaDto } from '../dto';

@Controller('/v4/inn/fmts/motor/secciones')
export class SeccionesController extends BaseShelteredController {
    constructor(private readonly seccionService: SeccionesService) {
        super();
    }

    @Post()
    public async create(@Body() data: CreateSeccionPlantillaDto): Promise<BaseApiResponse<SeccionPlantillaFmtRead>> {
        const seccion = await this.seccionService.create(data);
        return { data: seccion, message: 'Seccion creada con exito' }
    }

    @Get()
    public async getAllSecciones(): Promise<BaseApiResponse<SeccionPlantillaFmtRead[]>> {
        const secciones = await this.seccionService.getAll();
        return { data: secciones }
    }

    @Get('/:id')
    public async getSeccionById(
        @Param('id', ParseIntPipe) id: number):
        Promise<BaseApiResponse<SeccionPlantillaFmtRead>> {
        const seccion = await this.seccionService.getById(id);
        return { data: seccion }
    }

    @Get('anex/imgs')
    public async getAllConfigImagenes(): Promise<BaseApiResponse<any>> {
        const configImgs = await this.seccionService.getAllSeccionAnexImagenes();
        return {
            data: configImgs.map(cfg => ({
                ...SeccionAnexosMapper.toView(cfg),
                imagenes: cfg.getImagenes,
                observacionGeneral: cfg.getObservacionGeneral
            }))
        };
    }

    @Get('anex/imgs/:id')
    public async getConfigImagenesById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseApiResponse<any>> {
        const cfg = await this.seccionService.findSeccionAnexImagenesById(id);
        if (!cfg) return { data: null };
        return {
            data: {
                ...SeccionAnexosMapper.toView(cfg),
                imagenes: cfg.getImagenes,
                observacionGeneral: cfg.getObservacionGeneral
            }
        };
    }
}
