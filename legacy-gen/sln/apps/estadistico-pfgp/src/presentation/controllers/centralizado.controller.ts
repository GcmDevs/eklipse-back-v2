import { SLN_AUTHORITIES } from '@authorities/facturacion';
import { generateDateFromQuery } from '@common/application/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { FetchAcostadoImpl } from '@sln/pfgp/infrastructure/services/acostado';
import { FetchFacturadoImpl } from '@sln/pfgp/infrastructure/services/facturado';
import { FetchConsolidadoImpl } from '@sln/pfgp/infrastructure/services/consolidado';
import { validacionesMes } from '@sln/pfgp/application/services';

@CommonGuards()
@Controller('v1/pfgp/centralizado')
export class CentralizadoController {
  constructor(
    private _fetchAcostado: FetchAcostadoImpl,
    private _fetchFacturado: FetchFacturadoImpl,
    private _fetchConsolidado: FetchConsolidadoImpl
  ) {}

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_PFGP])
  @Get()
  public async fetch(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('centroId') centroId: number
  ) {
    try {
      inicio = generateDateFromQuery(inicio);
      final = generateDateFromQuery(final, true);
      centroId = centroId == 99 || centroId == 0 ? 0 : +centroId;

      const validaciones = validacionesMes(inicio);

      const canSeeAcos = validaciones.isMesActual || validaciones.isMesAnterior;
      const canSeeConso = validaciones.isMesActual;

      const facturado = await this._fetchFacturado.execute(inicio, final, centroId);

      const acostado = canSeeAcos
        ? await this._fetchAcostado.execute(
            centroId,
            inicio,
            facturado.agruServs,
            facturado.checkPoints
          )
        : [];

      const consolidado = canSeeConso
        ? await this._fetchConsolidado.execute(facturado.data, acostado)
        : [];

      if (canSeeAcos) {
        facturado.data.map(f => {
          const acostadoFiltered = acostado.filter(ac => ac.idContrato === f.idContrato);
          if (acostadoFiltered.length) {
            f.totalDisponibilidad = f.totalDiferencia - acostadoFiltered[0].totalFacturado;
          } else {
            f.totalDisponibilidad = f.totalDiferencia;
          }
        });
      }

      return {
        facturado: facturado.data,
        acostado,
        consolidado,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
