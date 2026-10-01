import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcostadoProxyRepository } from '../../acostado/infrastructure';
import {
  FetchAgrupadoresByConsecutivoFacturadoHandler,
  FetchContratosFacturadosHandler,
  FetchFacturasByContratoFacturadoHandler,
  FetchLargasEstanciasByContratoFacturadoHandler,
  FetchServiciosByConsecutivoFacturadoHandler,
} from '../handlers';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SLN_AUTHORITIES } from '@authorities/facturacion';

@ApiTags('V1 - Estadistico PFGP (Facturado)')
@CommonGuards()
@Controller('v1/sln/inf-ger/est-pgp/facturado')
export class FacturadoController {
  constructor(
    private _fetchContratos: FetchContratosFacturadosHandler,
    private _fetchFacturasByContrato: FetchFacturasByContratoFacturadoHandler,
    private _fetchLargasEstanciasByContrato: FetchLargasEstanciasByContratoFacturadoHandler,
    private _fetchAgrupadoresByConsecutivo: FetchAgrupadoresByConsecutivoFacturadoHandler,
    private _fetchServiciosByConsecutivo: FetchServiciosByConsecutivoFacturadoHandler,
    private _acostado: AcostadoProxyRepository
  ) {}

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_PFGP])
  @Get('contratos')
  async contratos(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('idCentro') idCentro: number
  ) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:23:59`);

    if (idCentro == 99) idCentro = 0;

    const payload = {
      inicio,
      final,
      idCentro: +idCentro,
    };

    return await this._fetchContratos.execute(payload);
  }

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_PFGP])
  @Get('contratos/facturas')
  async facturasByContrato(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('idCentro') idCentro: number,
    @Query('codigosContratos') codigosContratos: string | string[]
  ) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:23:59`);

    if (idCentro == 99) idCentro = 0;

    const payload = {
      inicio,
      final,
      idCentro: +idCentro,
      codigosContratos: Array.isArray(codigosContratos) ? codigosContratos : [codigosContratos],
    };

    return await this._fetchFacturasByContrato.execute(payload);
  }

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_PFGP])
  @Get('contratos/largas-estancias')
  async largasEstanciasByContrato(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('idCentro') idCentro: number,
    @Query('codigosContratos') codigosContratos: string | string[]
  ) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:23:59`);

    if (idCentro == 99) idCentro = 0;

    const payload = {
      inicio,
      final,
      idCentro: +idCentro,
      codigosContratos: Array.isArray(codigosContratos) ? codigosContratos : [codigosContratos],
    };

    return await this._fetchLargasEstanciasByContrato.execute(payload);
  }

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_PFGP])
  @Get('diferencia')
  async diferenciaConsolidado(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('idCentro') idCentro: number
  ) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:23:59`);

    if (idCentro == 99) idCentro = 0;

    const payload = {
      inicio,
      final,
      idCentro: +idCentro,
      codigosContratos: [],
    };

    try {
      return await this._acostado.getDiferenciaConsolidado(payload);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_PFGP])
  @Get('agrupadores-by-consecutivo')
  async agrupadoresByConsecutivo(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('idCentro') idCentro: number,
    @Query('consecutivo') consecutivo: number,
    @Query('codigosContratos') codigosContratos: string | string[]
  ) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:23:59`);

    if (idCentro == 99) idCentro = 0;

    const payload = {
      inicio,
      final,
      idCentro: +idCentro,
      consecutivo: +consecutivo,
      codigosContratos: Array.isArray(codigosContratos) ? codigosContratos : [codigosContratos],
    };

    return await this._fetchAgrupadoresByConsecutivo.execute(payload);
  }

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_PFGP])
  @Get('servicios-by-consecutivo')
  async serviciosByConsecutivo(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('idCentro') idCentro: number,
    @Query('consecutivo') consecutivo: number,
    @Query('codigosContratos') codigosContratos: string | string[]
  ) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:23:59`);

    if (idCentro == 99) idCentro = 0;

    const payload = {
      inicio,
      final,
      idCentro: +idCentro,
      consecutivo: +consecutivo,
      codigosContratos: Array.isArray(codigosContratos) ? codigosContratos : [codigosContratos],
    };

    return await this._fetchServiciosByConsecutivo.execute(payload);
  }
}
