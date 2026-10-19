import { INN_AUTHORITIES } from '@authorities/inventario';
import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Authorities } from '@common/presentation/decorators';
import { PaginationHelper } from '@common/presentation/helpers';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { EstacionesServicioService } from 'apps/vehiculos/application';
import { EstacionServicioRead } from 'apps/vehiculos/domain/reads';
import { FilterEstacionServicioDto } from '../dto';
import { CreateEstacionServicioDto } from '../dto/estacion-servicio.dto';

@Controller('/v4/inn/estacioneser')
export class EstacionServicioController extends BaseShelteredController {
  constructor(private readonly estacionService: EstacionesServicioService) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.ESTACIONES.GESTIONAR])
  @Post()
  public async create(
    @Body() data: CreateEstacionServicioDto
  ): Promise<BaseApiResponse<EstacionServicioRead>> {
    const estacion = await this.estacionService.create(data);
    return { data: estacion };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.ESTACIONES.VER])
  @Get()
  public async getAll(
    @Query() { page, limit, search, ...filters }: FilterEstacionServicioDto
  ): Promise<BaseApiResponse<EstacionServicioRead[]>> {
    const [items, count] = await this.estacionService.getAll(page, limit, search, filters);
    return PaginationHelper.response(items, count, page, limit);
  }
}
