import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { AuditoriaFetchIngresosUnautenticatedImpl } from '@auditoria/infrastructure/repositories';
import { GcmContextCode } from '@common/domain/types';

@Controller('v4/auditoria')
export class RecursosAuditoriaUnautenticatedController {
  constructor(private _fetchIngresos: AuditoriaFetchIngresosUnautenticatedImpl) {}

  @Get('fetch-all-ingresos/:contexto')
  public async fetchAllIngresos(@Param('contexto') contexto: GcmContextCode) {
    try {
      return await this._fetchIngresos.execute(contexto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
