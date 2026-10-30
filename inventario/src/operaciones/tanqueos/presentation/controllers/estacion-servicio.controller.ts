import { INN_AUTHORITIES } from '@inn/authorities';
import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Authorities } from '@common/presentation/decorators';
import { PaginationHelper } from '@common/presentation/helpers';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { EstacionesServicioService } from '@inn/operaciones/tanqueos/application';
import { EstacionServicioRead } from '@inn/operaciones/tanqueos/domain/reads';
import { FilterEstacionServicioDto } from '../dto';
import { CreateEstacionServicioDto, UpdateEstacionServicioDto } from '../dto/estacion-servicio.dto';

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

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.ESTACIONES.GESTIONAR])
  @Patch('/:id')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateEstacionServicioDto
  ): Promise<BaseApiResponse<EstacionServicioRead>> {
    const estacion = await this.estacionService.update(id, data);
    return { data: estacion, message: 'Estación de servicio actualizada' };
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
