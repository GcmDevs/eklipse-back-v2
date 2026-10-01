import { INN_AUTHORITIES } from '@authorities/inventario';
import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Authorities } from '@common/presentation/decorators';
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { RepositorioCombustibleService } from '@vehiculos/application';
import {
  AbastecimientoRead,
  MovimientoCombustibleRead,
  RepositorioCombustibleRead,
} from '@vehiculos/domain/reads';
import { CreateEntradaRepositorioDto, CreateRepositorioCombustibleDto } from '../dto';

@Controller('/v4/inn/vehiculos/repositorios-combustible')
export class RepositorioCombustibleController extends BaseShelteredController {
  constructor(private readonly repositorioService: RepositorioCombustibleService) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.REPOSITORIOS.CREAR])
  @Post()
  public async create(
    @Body() data: CreateRepositorioCombustibleDto
  ): Promise<BaseApiResponse<RepositorioCombustibleRead>> {
    const repositorio = await this.repositorioService.create(data);
    return { data: repositorio };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.REPOSITORIOS.RECARGAR])
  @Post('/:id/entradas')
  public async registerEntrada(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateEntradaRepositorioDto
  ): Promise<BaseApiResponse<AbastecimientoRead>> {
    const abastecimiento = await this.repositorioService.registerEntrada(id, data);
    return { data: abastecimiento, message: 'Entrada de combustible registrada' };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.REPOSITORIOS.VER])
  @Get()
  public async getAll(): Promise<BaseApiResponse<RepositorioCombustibleRead[]>> {
    const items = await this.repositorioService.findAll();
    return { data: items };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.REPOSITORIOS.VER])
  @Get('/:id/movimientos')
  public async getMovimientos(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<MovimientoCombustibleRead[]>> {
    const movimientos = await this.repositorioService.findMovimientos(id);
    return { data: movimientos };
  }
}
