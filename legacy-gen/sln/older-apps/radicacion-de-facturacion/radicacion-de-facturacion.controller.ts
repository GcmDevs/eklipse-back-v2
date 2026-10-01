import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RadicacionDeFacturacionService } from './radicacion-de-facturacion.service';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ADMIN_AUTHORITY } from '@authorities/principal';
import { SLN_AUTHORITIES } from '@authorities/facturacion';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/radicacion-de-facturacion')
export class RadicacionDeFacturacionController {
  constructor(private readonly radicacionServices: RadicacionDeFacturacionService) {}

  @Authorities([ADMIN_AUTHORITY, SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_RADICACION])
  @Get()
  async fullData(
    @Query('fechaInicio') fechaInicio: Date,
    @Query('fechaFin') fechaFin: Date,
    @Query('centro1') centro1: number,
    @Query('centro2') centro2: number
  ) {
    const inicio = fechaInicio as any as string;
    const final = fechaFin as any as string;
    return await this.radicacionServices.fullData(inicio, final, +centro1, +centro2);
  }

  @Authorities([ADMIN_AUTHORITY, SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_RADICACION])
  @Get('facturas-pendientes')
  async facturasPendientes() {
    return await this.radicacionServices.facturasSinRadicar();
  }
}
