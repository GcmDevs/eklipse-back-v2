import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  FetchAgrupadoresByContratoConsolidadoHandler,
  FetchContratosConsolidadosHandler,
  FetchPacientesByContratoConsolidadoHandler,
  FetchServiciosByConsecutivoConsolidadoHandler,
} from '../handlers/consolidado';
import { Authorities, CommonGuards } from '@sln/old/common/presentation/decorators';
import { AUTHORITIES } from '@sln/old/authorities/principal';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v20/informes-gerenciales/estadistico-pfgp/consolidado')
export class ConsolidadoController {
  constructor(
    private _fetchContratos: FetchContratosConsolidadosHandler,
    private _fetchAgrupadoresByContrato: FetchAgrupadoresByContratoConsolidadoHandler,
    private _fetchPacientesByContrato: FetchPacientesByContratoConsolidadoHandler,
    private _fetchServiciosByConsecutivo: FetchServiciosByConsecutivoConsolidadoHandler
  ) {}

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.ESTADISTICO_PFGP,
  ])
  @Get('contratos')
  async contratos(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('idCentro') idCentro: number
  ) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);

    if (idCentro == 99) idCentro = 0;

    const payload = {
      inicio,
      final,
      idCentro: +idCentro,
    };

    return await this._fetchContratos.execute(payload);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.ESTADISTICO_PFGP,
  ])
  @Get('contratos/agrupadores')
  async agrupadoresContratos(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('idCentro') idCentro: number,
    @Query('codigosContratos') codigosContratos: string | string[]
  ) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);

    if (idCentro == 99) idCentro = 0;

    const payload = {
      inicio,
      final,
      idCentro: +idCentro,
      codigosContratos: Array.isArray(codigosContratos) ? codigosContratos : [codigosContratos],
    };

    return await this._fetchAgrupadoresByContrato.execute(payload);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.ESTADISTICO_PFGP,
  ])
  @Get('contratos/pacientes')
  async pacientesContratos(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('idCentro') idCentro: number,
    @Query('codigosContratos') codigosContratos: string | string[]
  ) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);

    if (idCentro == 99) idCentro = 0;

    const payload = {
      inicio,
      final,
      idCentro: +idCentro,
      codigosContratos: Array.isArray(codigosContratos) ? codigosContratos : [codigosContratos],
    };

    return await this._fetchPacientesByContrato.execute(payload);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.ESTADISTICO_PFGP,
  ])
  @Get('servicios-by-consecutivo/:consecutivo')
  async serviciosByConsecutivo(
    @Param('consecutivo') consecutivo: number,
    @Query('codigosContratos') codigosContratos: string | string[]
  ) {
    const codigosContratosFt = Array.isArray(codigosContratos)
      ? codigosContratos
      : [codigosContratos];

    return await this._fetchServiciosByConsecutivo.execute(codigosContratosFt, +consecutivo);
  }
}
