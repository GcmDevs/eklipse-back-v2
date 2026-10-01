import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ItdBillingImpl } from '@hpn/ori/die/infrastructure/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { removeTimeZone } from '@common/application/services';
import { DietaNoRecibidaDto } from '../dtos';
import { DIE_AUTHORITIES } from '@hpn/ori/die/application/constants';

@CommonGuards()
@ApiTags('v1 - Dietas')
@Controller('dim/dietas/v1')
export class DietasNoRecibidasController {
  constructor(private _services: ItdBillingImpl) {}

  @Authorities([DIE_AUTHORITIES.REPORTAR_NO_RECIBIDAS, DIE_AUTHORITIES.FACTURACION])
  @Get('no-recibidas')
  async fetch(@Query('fecha') fecha: Date) {
    try {
      if (!fecha) fecha = removeTimeZone(new Date());
      else fecha = new Date(`${fecha}`);
      const data: any[] = [];

      const newData = {
        amountReceived: 0,
        amountUnreceived: 0,
        totalReceived: 0,
        totalUnreceived: 0,
        data: [],
      };

      const centros = await this._services.fetchCentros();
      for (let index = 0; index < centros.length; index++) {
        const centro = centros[index];
        const result = await this._services.fetchByDay(centro, fecha);
        result.centro = centro;
        data.push(result);
      }

      data.forEach(d => {
        newData.amountReceived += d.amountReceived;
        newData.amountUnreceived += d.amountUnreceived;
        newData.totalReceived += d.totalReceived;
        newData.totalUnreceived += d.totalUnreceived;
      });

      newData.data = data;

      return newData;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([DIE_AUTHORITIES.REPORTAR_NO_RECIBIDAS])
  @Put('no-recibidas')
  async update(@Body() body: DietaNoRecibidaDto) {
    try {
      return this._services.markAsUnreceived(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
