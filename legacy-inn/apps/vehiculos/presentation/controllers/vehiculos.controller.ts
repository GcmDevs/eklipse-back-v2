import { INN_AUTHORITIES } from '@authorities/inventario';
import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Authorities } from '@common/presentation/decorators';
import { PaginationHelper } from '@common/presentation/helpers';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { VehiculosService } from 'apps/vehiculos/application';
import { VehiculoRead } from 'apps/vehiculos/domain/reads';
import { CreateVehiculoDto, FilterVehiculoDto, UpdateVehiculoDto } from '../dto';

@Controller('/v4/inn/vehiculos')
export class VehiculoController extends BaseShelteredController {
  constructor(private readonly vehiculoService: VehiculosService) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.VEHICULOS.GESTIONAR])
  @Post()
  public async create(@Body() data: CreateVehiculoDto): Promise<BaseApiResponse<VehiculoRead>> {
    const vehiculo = await this.vehiculoService.create(data);
    return { data: vehiculo };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.VEHICULOS.VER])
  @Get()
  public async getAll(
    @Query() { page, limit, search, ...filters }: FilterVehiculoDto
  ): Promise<BaseApiResponse<VehiculoRead[]>> {
    const [items, count] = await this.vehiculoService.getAll(page, limit, search, filters);
    return PaginationHelper.response(items, count, page, limit);
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.VEHICULOS.GESTIONAR])
  @Patch('/:id')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateVehiculoDto
  ): Promise<BaseApiResponse<VehiculoRead>> {
    const vehiculo = await this.vehiculoService.update(id, data);
    return { data: vehiculo };
  }
}
