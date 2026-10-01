import { SLN_AUTHORITIES } from '@authorities/facturacion';
import { generateDateFromQuery } from '@common/application/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { FetchAcostadoImpl } from '@sln/pfgp/infrastructure/services/acostado';

@CommonGuards()
@Controller('v1/pfgp/acostado')
export class AcostadoController {
  constructor(private _fetch: FetchAcostadoImpl) {}

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.ESTADISTICO_PFGP])
  @Get()
  public fetch(@Query('inicio') inicio: Date, @Query('centroId') centroId: number) {
    try {
      inicio = generateDateFromQuery(inicio);
      centroId = centroId == 99 || centroId == 0 ? 0 : +centroId;
      return this._fetch.execute(centroId, inicio);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
