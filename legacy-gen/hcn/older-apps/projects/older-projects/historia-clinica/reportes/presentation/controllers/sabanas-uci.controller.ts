import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FetchReporteSabanasUciServices } from '@hcn/rft/historia-clinica/reportes/infrastructure/services';
import { Authorities, CommonGuards } from '@hcn/old/common/presentation/decorators';
import { HCN_AUTHORITIES } from '@authorities/historia-clinica';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v30/reportes/sabanas-uci')
export class SabanasUciController {
  constructor(private _fetchReporteSabanasUci: FetchReporteSabanasUciServices) {}

  @Authorities([HCN_AUTHORITIES.BALANCES_ENFERMERIA.SABANAS_UCI])
  @Get()
  async fetchByConsecutivo(@Query('consecutivo') consecutivo: number, @Query('fecha') fecha: Date) {
    try {
      fecha = new Date(`${fecha}:00:00`);
      return await this._fetchReporteSabanasUci.single(consecutivo, fecha);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
