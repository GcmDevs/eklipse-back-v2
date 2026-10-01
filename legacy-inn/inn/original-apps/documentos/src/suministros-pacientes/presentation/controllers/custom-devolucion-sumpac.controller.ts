import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CustomDevolucionSumpacImpl } from '../../infrastructure/services';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { CustomDevolucionSumPacDto } from '../dtos';
import { ApiTags } from '@nestjs/swagger';
import { TipoDevolucionCode } from '../../domain/types';

@ApiTags('V1 - Documentos (Suministro a pacientes)')
@CommonGuards()
@Controller('v1/inn/doc/sumpac/dev-ctm')
export class CustomDevolucionSumPacController {
  constructor(private _devSumPac: CustomDevolucionSumpacImpl) {}

  @Authorities([
    INN_AUTHORITIES.SUMINISTROS.GESTION_SUM_MEZCLA_DEV,
    INN_AUTHORITIES.FARMACIA.GESTION_DEMANDAS_INSATISFECHAS,
  ])
  @Get()
  public async fetch(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('tipoCode') tipoCode: TipoDevolucionCode
  ) {
    inicio = new Date(`${inicio}:00:00:00`);
    final = new Date(`${final}:23:59:59`);

    try {
      const result = await this._devSumPac.fetch(inicio, final, tipoCode);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    INN_AUTHORITIES.SUMINISTROS.GESTION_SUM_MEZCLA_DEV,
    INN_AUTHORITIES.FARMACIA.GESTION_DEMANDAS_INSATISFECHAS,
  ])
  @Post()
  public async create(@Body() payload: CustomDevolucionSumPacDto) {
    try {
      const result = await this._devSumPac.create(payload);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    INN_AUTHORITIES.SUMINISTROS.GESTION_SUM_MEZCLA_DEV,
    INN_AUTHORITIES.FARMACIA.GESTION_DEMANDAS_INSATISFECHAS,
  ])
  @Get('by-pattern')
  public async fetchByPattern(@Query('pattern') pattern: string) {
    try {
      const response = await this._devSumPac.fetchByPattern(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    INN_AUTHORITIES.SUMINISTROS.GESTION_SUM_MEZCLA_DEV,
    INN_AUTHORITIES.FARMACIA.GESTION_DEMANDAS_INSATISFECHAS,
  ])
  @Get('by-pattern-producto')
  public async fetchByPatternProdcuto(@Query('pattern') pattern: string) {
    try {
      const response = await this._devSumPac.fetchByPatternProducto(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([
    INN_AUTHORITIES.SUMINISTROS.GESTION_SUM_MEZCLA_DEV,
    INN_AUTHORITIES.FARMACIA.GESTION_DEMANDAS_INSATISFECHAS,
  ])
  @Get('by-pattern-agrupamiento')
  public async fetchByPatternAgrupamiento(@Query('pattern') pattern: string) {
    try {
      const response = await this._devSumPac.fetchByPatternAgrupamiento(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
