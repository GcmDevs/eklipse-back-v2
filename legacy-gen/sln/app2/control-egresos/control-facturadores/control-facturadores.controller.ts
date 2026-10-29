import { Authorities, CommonGuards } from '@common/presentation/decorators';
import {
  Body,
  BadRequestException,
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
import { ActualizarFacturadorDto } from './dtos/actualizar-facturador.dto';

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
  @Get('/roles')
  async getRoles() {
    return this._facturadoresImpl.getRoles();
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
  @Get(['/facturas-asignadas', '/facturas-asignadas/periodo'])
  async facturasAsignadas(
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
    @Query('start') start: string,
    @Query('end') end: string
  ) {
    const [inicio, fin] = this.parseDateRange(start, end);
    return await this._facturadoresImpl.facturasAsignadas(usuarioId, inicio, fin);
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get(['/facturas-finalizadas', '/facturas-finalizadas/periodo'])
  async facturasFinalizadas(
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
    @Query('start') start: string,
    @Query('end') end: string
  ) {
    const [inicio, fin] = this.parseDateRange(start, end);
    return await this._facturadoresImpl.facturasFinalizadas(usuarioId, inicio, fin);
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get('/ingreso-egresos-data')
  async ingresoAbiertos() {
    return await this._facturadoresImpl.ingresoAbiertos();
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get('/comportamiento-robot')
  async comportamientoRobot(@Query('fecha') fecha: string) {
    const [dia] = this.parseDateRange(fecha, fecha);
    return this._facturadoresImpl.comportamientoRobot(dia);
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get('/comportamiento-robot/detalle')
  async detalleComportamientoRobot(
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
    @Query('fecha') fecha: string
  ) {
    if (usuarioId <= 0) throw new BadRequestException('Selecciona un facturador válido.');
    const [dia] = this.parseDateRange(fecha, fecha);
    return this._facturadoresImpl.detalleComportamientoRobot(usuarioId, dia);
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Post('/agregar')
  async agregarFacturadores() {
    return await this._facturadoresImpl.agregarFacturadores();
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Get('/generar-excel')
  async generarExcelEgresosFacturacion(@Query('start') start: string, @Query('end') end: string) {
    const [inicioDate, finalDate] = this.parseDateRange(start, end);
    return this._facturadoresImpl.generarExcelEgresosFacturacion(inicioDate, finalDate);
  }

  private parseDateRange(start: string, end: string): [Date, Date] {
    const parseDate = (value: string): Date => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
        throw new BadRequestException('Selecciona un rango de fechas válido (YYYY-MM-DD).');
      }
      const date = new Date(`${value}T00:00:00Z`);
      if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new BadRequestException('El rango contiene una fecha inválida.');
      }
      return date;
    };
    const inicioDate = parseDate(start);
    const finalDate = parseDate(end);
    if (inicioDate > finalDate) {
      throw new BadRequestException('La fecha inicial no puede ser posterior a la final.');
    }
    return [inicioDate, finalDate];
  }

  @Authorities([SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO])
  @Put('/:id')
  async actualizarFacturador(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarFacturadorDto
  ) {
    return await this._facturadoresImpl.actualizarFacturador(id, body);
  }
}
