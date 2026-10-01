import { SLN_AUTHORITIES } from '@authorities/facturacion';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { MotivoNoFacturacionType } from '@ctypes/gen';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { MotivoNoFacturacionImpl } from 'apps/control-egresos/facturacion/infrastructure/services/motivo-no-facturacion.impl';

@CommonGuards()
@Controller('/v4/control-egresos/motivos-no-facturacion')
export class MotivoNoFacturacionController {
  constructor(private _motivoNoFacturacion: MotivoNoFacturacionImpl) {}

  @Get()
  async getMotivosNoFacturacion(): Promise<MotivoNoFacturacionType[]> {
    try {
      return await this._motivoNoFacturacion.getMotivoNoFacturacion();
    } catch (error) {
      console.error('Error procesando motivo no facturación:', error);
      throw new BadRequestException(error.message);
    }
  }
}
