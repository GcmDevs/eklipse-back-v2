import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FacturacionTerceroMesModel } from '../domain';
import { GetFacturacionEntidadesHandler, GetFacturacionTercerosHandler } from './handlers';
import { Authorities, CommonGuards } from '@sln/old/common/presentation/decorators';
import { GcmContexts } from '@common/application/constants';
import { AUTHORITIES } from '@sln/old/authorities/principal';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v20/informes-gerenciales/facturacion-terceros')
export class FacturacionTercerosController {
  constructor(
    private _getFacturacionTerceros: GetFacturacionTercerosHandler,
    private _getFacturacionEntidades: GetFacturacionEntidadesHandler
  ) {}

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_TERCEROS,
  ])
  @Get(':inicio/:final/:centroId/:byDay')
  getFacturacionTerceros(
    @Req() @Param('inicio') inicio: Date,
    @Req() @Param('final') final: Date,
    @Req() @Param('centroId') centroId: number,
    @Param('byDay') byDay?: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    return this._getFacturacionTerceros.execute(inicio, final, centroId, byDay || false);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACTURACION_TERCEROS,
  ])
  @Get('entidades/:inicio/:final/:centroId/:terceroId/:byDay')
  getFacturacionEntidades(
    @Req() @Param('inicio') inicio: Date,
    @Req() @Param('final') final: Date,
    @Req() @Param('centroId') centroId: number,
    @Req() @Param('terceroId') terceroId: number,
    @Param('byDay') byDay?: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    return this._getFacturacionEntidades.execute(
      inicio,
      final,
      centroId,
      terceroId,
      byDay || false
    );
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACT_TERCEROS_INSTITUCION,
  ])
  @Get('by-centro')
  getFacturacionTercerosByCentro(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('byDay') byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    return this._getFacturacionTerceros.executeByCentro(inicio, final, byDay || false);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.FACT_TERCEROS_INSTITUCION,
  ])
  @Get('entidades-by-centro')
  getFacturacionEntidadesByCentro(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('centroId') centroId: number,
    @Query('terceroId') terceroId: number,
    @Query('context') context: GcmContexts,
    @Query('byDay') byDay?: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    return this._getFacturacionEntidades.executeByCentro({
      inicio,
      final,
      centroId,
      terceroId,
      byDay: byDay || false,
      context,
    });
  }
}
