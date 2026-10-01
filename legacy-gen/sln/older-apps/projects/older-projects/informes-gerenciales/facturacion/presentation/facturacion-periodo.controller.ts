import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  FacturacionPeriodoModel,
  ResumenPeriodoEntidadesModel,
  ResumenPeriodoModel,
} from '../domain';
import { GetFacturacionPeriodoHandler, GetResumenPeriodoHandler } from './handlers';
import { Authorities, CommonGuards } from '@sln/old/common/presentation/decorators';
import { AUTHORITIES } from '@sln/old/authorities/principal';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v20/informes-gerenciales/facturacion-periodo')
export class FacturacionPeriodoController {
  constructor(
    private _getFacturacionPeriodo: GetFacturacionPeriodoHandler,
    private _getResumenPeriodo: GetResumenPeriodoHandler
  ) {}

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_PERIODO,
  ])
  @Get(':inicio/:final')
  getFacturacionPeriodo(
    @Req() @Param('inicio') inicio: Date,
    @Req() @Param('final') final: Date
  ): Promise<FacturacionPeriodoModel> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);

    return this._getFacturacionPeriodo.execute(inicio, final);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_PERIODO,
  ])
  @Get('resumen/:inicio/:final/:centroId')
  getResumenPorPeriodo(
    @Req() @Param('inicio') inicio: Date,
    @Req() @Param('final') final: Date,
    @Req() @Param('centroId') centroId: number
  ): Promise<ResumenPeriodoModel[]> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);

    return this._getResumenPeriodo.execute(inicio, final, centroId);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_PERIODO_POR_ENTIDADES,
  ])
  @Get('resumen-entidades/:inicio/:final')
  getResumenPorPeriodoEntidades(
    @Req() @Param('inicio') inicio: Date,
    @Req() @Param('final') final: Date
  ): Promise<ResumenPeriodoEntidadesModel[]> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    return this._getResumenPeriodo.porEntidades(inicio, final);
  }
}
