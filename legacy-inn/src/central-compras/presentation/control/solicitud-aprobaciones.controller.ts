import { BadRequestException, Body, Controller, Patch, Post } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { CambioEstadoOrm } from '@orm/inn/central-compras';
import { AprobacionesSolicitudesImpl } from '@inn/central-compras/infrastructure/servis';
import { OldAprobarSolicitudDto, OldCajaMenorExpressDto } from '../dtos';
import { ApiTags } from '@nestjs/swagger';

@CommonGuards()
@ApiTags('V4')
@Controller('v4/central-compras/solicitudes')
export class SolicitudAprobacionesController {
  constructor(private _aprobaciones: AprobacionesSolicitudesImpl) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.APRO_RECH_GERENTE])
  @Patch('aprobar')
  public async fetch(@Body() body: OldAprobarSolicitudDto): Promise<CambioEstadoOrm> {
    try {
      const response = await this._aprobaciones.vistoBuenoInicial(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CAJA_MENOR_EXPRESS])
  @Post('caja-menor-express')
  public async cajaMenorExpress(@Body() body: OldCajaMenorExpressDto): Promise<boolean> {
    try {
      const response = await this._aprobaciones.cajaMenorExpress(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
