import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RadicacionDeFacturacionService } from './radicacion-de-facturacion.service';
import { Authorities, CommonGuards } from '@sln/old/common/presentation/decorators';
import { AUTHORITIES } from '@sln/old/authorities/principal';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/radicacion-de-facturacion')
export class RadicacionDeFacturacionController {
  constructor(private readonly radicacionServices: RadicacionDeFacturacionService) {}

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.ESTADISTICO_RADICACION,
  ])
  @Get()
  async fullData(
    @Query('fechaInicio') fechaInicio: Date,
    @Query('fechaFin') fechaFin: Date,
    @Query('centro1') centro1: number,
    @Query('centro2') centro2: number
  ) {
    fechaInicio = new Date(`${fechaInicio}:00:00`);
    fechaFin = new Date(`${fechaFin}:00:00`);
    const fechaini = fechaInicio.toISOString().split('T')[0];
    const fechaF = fechaFin.toISOString().split('T')[0];
    return await this.radicacionServices.fullData(fechaini, fechaF, +centro1, +centro2);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.ESTADISTICO_RADICACION,
  ])
  @Get('contrato')
  async contrato(
    @Query('fechaInicio') fechaInicio: Date,
    @Query('fechaFin') fechaFin: Date,
    @Query('contrato') contrato: number
  ) {
    fechaInicio = new Date(`${fechaInicio}:00:00`);
    fechaFin = new Date(`${fechaFin}:00:00`);
    const fechaini = fechaInicio.toISOString().split('T')[0];
    const fechaF = fechaFin.toISOString().split('T')[0];
    return await this.radicacionServices.radicacionPorEntidadesPorContrato(
      fechaini,
      fechaF,
      +contrato
    );
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.ESTADISTICO_RADICACION,
  ])
  @Get('pendientes/:fechaInicio/:fechaFin')
  async radicacionPendiente(
    @Param('fechaInicio') fechaInicio: Date,
    @Param('fechaFin') fechaFin: Date
  ) {
    fechaInicio = new Date(`${fechaInicio}:00:00`);
    fechaFin = new Date(`${fechaFin}:00:00`);
    const fechaini = fechaInicio.toISOString().split('T')[0];
    const fechaF = fechaFin.toISOString().split('T')[0];
    return await this.radicacionServices.radicacionPendienteMesesAnteriores(fechaini, fechaF);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.ESTADISTICO_RADICACION,
  ])
  @Get('facturas-pendientes')
  async facturasPendientes() {
    return await this.radicacionServices.facturasSinRadicar();
  }
}
