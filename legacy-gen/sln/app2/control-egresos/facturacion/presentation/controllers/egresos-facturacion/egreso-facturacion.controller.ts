import { SLN_AUTHORITIES } from '@authorities/facturacion';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { EgresosResponse } from 'sln/app2/control-egresos/facturacion/domain/models';
import { EgresoFacturacionImpl } from 'sln/app2/control-egresos/facturacion/infrastructure/services/egreso-facturacion.impl';

@CommonGuards()
@Controller('v4/control-egresos/egresos-facturacion')
export class EgresoFacturacionController {
  constructor(private _egresoFacturacion: EgresoFacturacionImpl) {}

  @Authorities([
    SLN_AUTHORITIES.CONTROL_EGRESOS.VER_EGRESOS,
    SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO,
    SLN_AUTHORITIES.CONTROL_EGRESOS.CREAR_PENDIENTES,
  ])
  @Get()
  async getEgresosFacturacion(
    @Query('start') start: string,
    @Query('end') end: string
  ): Promise<EgresosResponse> {
    try {
      if (!start || !end) {
        throw new BadRequestException('Los parámetros start y end son obligatorios');
      }

      const inicioDate = new Date(`${start}T00:00:00`);
      const finalDate = new Date(`${end}T23:59:59`);

      if (isNaN(inicioDate.getTime()) || isNaN(finalDate.getTime())) {
        throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
      }

      if (inicioDate.getTime() > finalDate.getTime()) {
        throw new BadRequestException('El rango de fecha es inválido');
      }

      return await this._egresoFacturacion.getEgresosFacturacion(inicioDate, finalDate);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
