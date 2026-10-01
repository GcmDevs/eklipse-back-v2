import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  FetchAgrupadoresByConsecutivoAcostadoHandler,
  FetchContratosAcostadosHandler,
  FetchEstanciasByConsecutivoAcostadoHandler,
  FetchPacientesByContratoAcostadoHandler,
  FetchServiciosByConsecutivoAcostadoHandler,
} from '../handlers';
import { Authorities, CommonGuards } from '@sln/old/common/presentation/decorators';
import { AUTHORITIES } from '@sln/old/authorities/principal';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v20/informes-gerenciales/estadistico-pfgp/acostado')
export class AcostadoController {
  constructor(
    private _fetchContratos: FetchContratosAcostadosHandler,
    private _fetchPacientesByContrato: FetchPacientesByContratoAcostadoHandler,
    private _fetchEstanciasByConsecutivo: FetchEstanciasByConsecutivoAcostadoHandler,
    private _fetchAgrupadoresByConsecutivo: FetchAgrupadoresByConsecutivoAcostadoHandler,
    private _fetchServiciosByConsecutivo: FetchServiciosByConsecutivoAcostadoHandler
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
  @Get('contratos/pacientes')
  async pacientesByContrato(
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
  @Get('estancias-by-consecutivo/:consecutivo')
  async estanciasByConsecutivo(@Param('consecutivo') consecutivo: number) {
    return await this._fetchEstanciasByConsecutivo.execute(+consecutivo);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.INFORMES_GERENCIALES.ESTADISTICO_PFGP,
  ])
  @Get('agrupadores-by-consecutivo/:consecutivo')
  async agrupadoresByConsecutivo(
    @Param('consecutivo') consecutivo: number,
    @Query('codigosContratos') codigosContratos: string | string[]
  ) {
    const codigosContratosFt = Array.isArray(codigosContratos)
      ? codigosContratos
      : [codigosContratos];

    return await this._fetchAgrupadoresByConsecutivo.execute(+consecutivo, codigosContratosFt);
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

    return await this._fetchServiciosByConsecutivo.execute(+consecutivo, codigosContratosFt);
  }
}
