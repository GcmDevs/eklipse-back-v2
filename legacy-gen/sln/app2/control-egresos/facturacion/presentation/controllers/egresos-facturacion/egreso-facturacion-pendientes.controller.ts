import { SLN_AUTHORITIES } from '@authorities/facturacion';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { Body, Controller, Post } from '@nestjs/common';
import { PendienteDto } from 'sln/app2/control-egresos/facturacion/presentation/dtos/pendiente-model';
import { EgresoFacturacionImpl } from 'sln/app2/control-egresos/facturacion/infrastructure/services/egreso-facturacion.impl';
import { AsignarDto } from '../../dtos/asignar-model';

@CommonGuards()
@Controller('/v4/control-egresos/egresos-facturacion')
export class EgresoFacturacionPendientesController {
  constructor(private _egresoFacturacion: EgresoFacturacionImpl) {}

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.CREAR_PENDIENTES])
  @Post('/pendientes')
  async pendientesEgresosFacturacion(@Body() form: PendienteDto) {
    try {
      const success = await this._egresoFacturacion.savePendiente(form);
      return { success };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Post('/asignar')
  async asignarEgresosFacturacion(@Body() form: AsignarDto) {
    try {
      const success = await this._egresoFacturacion.saveAsignar(form);
      return { success };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }
}
