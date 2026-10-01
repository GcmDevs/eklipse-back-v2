import { SLN_AUTHORITIES } from '@authorities/facturacion';
import { generateDateFromQuery } from '@common/application/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { FetchFacturadoImpl } from '@sln/pfgp/infrastructure/services/facturado';

@CommonGuards()
@Controller('v1/pfgp/facturado')
export class FacturadoController {
  constructor(private _fetch: FetchFacturadoImpl) {}

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_PFGP])
  @Get()
  public fetch(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('centroId') centroId: number
  ) {
    try {
      inicio = generateDateFromQuery(inicio);
      final = generateDateFromQuery(final, true);
      centroId = centroId == 99 || centroId == 0 ? 0 : +centroId;
      return this._fetch.execute(inicio, final, centroId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
