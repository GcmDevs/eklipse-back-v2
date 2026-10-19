import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { OrdDesFetchPendienteRes } from '@inn/documentos/infrastructure/responses';
import { FetchOrdenesDespachoPendientesImpl } from '@inn/documentos/infrastructure/services/orden-despacho';
import { GcmContextCode } from '@common/domain/types';

@ApiTags('Ordenes de despacho')
@Controller('v1/inn/documentos/ordenes-despacho')
export class RecibirOrdenDespachoAuthUnreqController {
  constructor(private _fetchPendientes: FetchOrdenesDespachoPendientesImpl) {}

  @ApiOkResponse({ type: OrdDesFetchPendienteRes, isArray: true })
  @Get('fetch-pendientes')
  async fetchPendientes(@Query('contextCode') contextCode: GcmContextCode) {
    try {
      return this._fetchPendientes.execute(contextCode);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
