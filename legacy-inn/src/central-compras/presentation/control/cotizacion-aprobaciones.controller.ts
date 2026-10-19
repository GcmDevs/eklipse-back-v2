import { BadRequestException, Body, Controller, Patch } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { AprobacionesCotizacionesImpl } from '@inn/central-compras/infrastructure/servis';
import { OldAprobarCotizacionDto, OldPreaprobarCotizacionDto } from '../dtos';
import { ApiTags } from '@nestjs/swagger';

@CommonGuards()
@ApiTags('V4')
@Controller('v4/central-compras/cotizaciones')
export class CotizacionAprobacionesController {
  constructor(private _aprobaciones: AprobacionesCotizacionesImpl) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.RECOMENDAR_ITEMS_COTI])
  @Patch('preaprobar')
  public async preaprobar(@Body() body: OldPreaprobarCotizacionDto) {
    try {
      const response = await this._aprobaciones.preaprobar(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.APRO_RECH_COTI_RECOMEN])
  @Patch('aprobar')
  public async aprobar(@Body() body: OldAprobarCotizacionDto) {
    try {
      const response = await this._aprobaciones.aprobar(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
