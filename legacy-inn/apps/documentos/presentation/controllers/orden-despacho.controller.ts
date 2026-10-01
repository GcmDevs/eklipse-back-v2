import { Get, Controller, BadRequestException, Query } from '@nestjs/common';
import { OrdenDespachoSource } from '@documentos/infrastructure/repositories';
import { CommonGuards } from '@common/presentation/decorators';
import { GcmContextCode } from '@common/domain/types';

@CommonGuards()
@Controller('v4/documentos/ordenes-despacho')
export class OrdenDespachoController {
  constructor(private _ordenDespacho: OrdenDespachoSource) {}

  @Get('by-pattern-and-centro')
  async fetchActivos(
    @Query('pattern') pattern: string,
    @Query('contextCode') contextCode: GcmContextCode
  ) {
    try {
      return await this._ordenDespacho.fetchByCentroAndPattern(pattern, contextCode);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
