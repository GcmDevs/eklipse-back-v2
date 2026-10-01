import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { FacturaCrudHandler } from '../handlers';

@CommonGuards()
@ApiTags('Radicación de facturación')
@Controller('v1/radicacion-facturacion')
export class RadicacionFacturacionController {
  constructor(private _facturaCrud: FacturaCrudHandler) {}

  @Get()
  async fetch(
    @Query('start') start: Date,
    @Query('end') end: Date,
    @Query('centroId') centroId: number
  ) {
    start = new Date(`${start}:00:00`);
    end = new Date(`${end}:23:59`);
    return await this._facturaCrud.fetch(start, end, +centroId);
  }
}
