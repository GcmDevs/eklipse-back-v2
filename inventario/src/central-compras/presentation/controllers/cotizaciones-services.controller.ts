import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { CotizacionServicesSource } from '@inn/central-compras/infrastructure/services/cotizaciones';
import { INN_AUTHORITIES } from '@inn/authorities';
import { AddOCDto } from '../dtos/cotizaciones';

@CommonGuards()
@ApiTags('Cotizaciones')
@Controller('v1/inn/ctc/cotizaciones')
export class CotizacionServicesController {
  constructor(private _cotizacionServices: CotizacionServicesSource) {}

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC])
  @Patch('add-oc')
  public async agregarOC(@Body() body: AddOCDto): Promise<boolean> {
    try {
      return this._cotizacionServices.agregarOC(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
