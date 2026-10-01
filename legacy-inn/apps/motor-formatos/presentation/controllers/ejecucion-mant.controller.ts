import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { EjecucionMantService } from 'apps/motor-formatos/application';
import { CreateEjecucionMantItemDto, CreateGrupoEjecucionMantDto } from '../dto';

@Controller('/v4/inn/fmts/motor/ejecuciones-mant')
export class EjecucionMantController extends BaseShelteredController {
    constructor(private readonly ejecucionMantService: EjecucionMantService) {
        super();
    }

    @Post('/grupo-ejecucion')
    public async createGrpEjecucion(@Body() data: CreateGrupoEjecucionMantDto): Promise<BaseApiResponse<any>> {
        const grupoEjecucionSaved = await this.ejecucionMantService.createGrpEjecucion(data);
        return { data: grupoEjecucionSaved, message: 'grupo de ejecucion creado con exito' };
    }

    @Post('/ejecucion-items')
    public async createEjecucionItem(@Body() data: CreateEjecucionMantItemDto): Promise<BaseApiResponse<any>> {
        const ejecucionItemSaved = await this.ejecucionMantService.createEjecucionItem(data);
        return { data: ejecucionItemSaved, message: 'item de ejecucion creado con exito' };
    }

    @Get('/grupo-ejecucion')
    public async getAllGruposEjecucion(): Promise<BaseApiResponse<any[]>> {
        const gruposEjecucion = await this.ejecucionMantService.getAllGrpsEjecucion();
        return { data: gruposEjecucion };
    }

    @Get('/ejecucion-items')
    public async getAllEjecucionesItems(): Promise<BaseApiResponse<any[]>> {
        const ejecucionesItems = await this.ejecucionMantService.getAllEjecucionesItems();
        return { data: ejecucionesItems };
    }
}