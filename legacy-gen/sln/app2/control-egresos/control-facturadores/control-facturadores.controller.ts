import { Authorities, CommonGuards } from '@common/presentation/decorators';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FacturadoresImpl } from './control-facturadores.impl';
import { SLN_AUTHORITIES } from '@authorities/facturacion';

@CommonGuards()
@Controller('/v4/control-egresos/facturadores')
export class FacturadoresController {
  constructor(private _facturadoresImpl: FacturadoresImpl) {}

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get()
  async getFacturadores() {
    return await this._facturadoresImpl.getFacturadores();
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Post('/estado')
  async toggleFacturadorEstado(
    @Query('facturadorId', ParseIntPipe) facturadorId: number,
    @Query('nuevoEstado', ParseBoolPipe) nuevoEstado: boolean
  ) {
    return await this._facturadoresImpl.toggleFacturadorEstado(facturadorId, nuevoEstado);
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get('/facturas-asignadas')
  async facturasAsignadas(@Query('usuarioId') usuarioId: number) {
    return await this._facturadoresImpl.facturasAsignadas(usuarioId);
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get('/facturas-finalizadas')
  async facturasFinalizadas(@Query('usuarioId') usuarioId: number) {
    return await this._facturadoresImpl.facturasFinalizadas(usuarioId);
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get('/ingreso-egresos-data')
  async ingresoAbiertos() {
    return await this._facturadoresImpl.ingresoAbiertos();
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Post('/agregar')
  async agregarFacturadores() {
    return await this._facturadoresImpl.agregarFacturadores();
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get('/generar-excel')
  async generarExcelEgresosFacturacion(@Query('start') start: string, @Query('end') end: string) {
    try {
      const inicioDate = new Date(`${start}T00:00:00`);
      const finalDate = new Date(`${end}T23:59:59`);

      const success = await this._facturadoresImpl.generarExcelEgresosFacturacion(
        inicioDate,
        finalDate
      );

      return success;
    } catch (error: any) {
      console.error('Error procesando asignación de usuario de ingreso:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Put('/:id')
  async actualizarFacturador(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { rolId: number; estado: boolean }
  ) {
    return await this._facturadoresImpl.actualizarFacturador(id, body);
  }
}
