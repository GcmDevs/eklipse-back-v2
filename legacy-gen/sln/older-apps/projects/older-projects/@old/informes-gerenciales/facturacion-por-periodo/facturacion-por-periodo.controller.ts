import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FacturacionPorPeriodoService } from './facturacion-por-periodo.service';
import { FacturacionPorMesPayload } from './interfaces/facturacion-por-mes.interfaces';
import { Authorities, CommonGuards } from '@sln/old/common/presentation/decorators';
import { AUTHORITIES } from '@sln/old/authorities/principal';

/** @deprecated Use the v2 */
@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v10/facturacion')
export class FacturacionPorPeriodoController {
  constructor(private readonly service: FacturacionPorPeriodoService) {}

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_PERIODO,
  ])
  @Get(':fechaInicio/:fechaFin/:centro1/:centro2')
  async getFacturacionResumen(
    @Param('fechaInicio') fechaInicio: string,
    @Param('fechaFin') fechaFin: string,
    @Param('centro1') centro1: string,
    @Param('centro2') centro2: string
  ) {
    return await this.service.getFacturacionResumen(
      fechaInicio,
      fechaFin,
      Number(centro1),
      Number(centro2)
    );
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_PERIODO,
  ])
  @Post('por-mes')
  async getFacturacionPorMes(@Body() data: FacturacionPorMesPayload) {
    return await this.service.getFacturacionPorMes(data);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_PERIODO,
  ])
  @Get('datas/:fechaInicio/:fechaFin')
  async getFullData(
    @Param('fechaInicio') fechaInicio: string,
    @Param('fechaFin') fechaFin: string
  ) {
    return await this.service.getFullData(fechaInicio, fechaFin);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_PERIODO,
  ])
  @Get('contratos')
  async getContratosPorEntidad(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('entidad') entidad: string
  ) {
    return await this.service.getContratosPorEntidad(fechaInicio, fechaFin, entidad);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_PERIODO,
  ])
  @Get('usuario')
  async getFacturacionUsuario(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('usuario') usuario: string
  ) {
    return await this.service.getFacturacionPorUsuario(fechaInicio, fechaFin, usuario);
  }
}
