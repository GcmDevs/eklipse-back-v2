import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { HojasEspecialidadImpl } from '../../infrastructure/repositories/hojas-especialidad';
import { AgregarHojaEspecialidadDto, GuardarHojaEspecialidadDto } from '../dtos/hojas-especialidad';

@CommonGuards()
@Controller('v4/entrega-turnos/hojas-especialidad')
export class HojasEspecialidadController {
  constructor(private readonly hojas: HojasEspecialidadImpl) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Get('catalogo')
  catalogo(@Query('ingresoId', ParseIntPipe) ingresoId: number) {
    return this.hojas.catalogo(ingresoId);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Get('ingresos/:ingresoId')
  listar(@Param('ingresoId', ParseIntPipe) ingresoId: number) {
    return this.hojas.listar(ingresoId);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('ingresos/:ingresoId')
  agregar(
    @Param('ingresoId', ParseIntPipe) ingresoId: number,
    @Body() body: AgregarHojaEspecialidadDto
  ) {
    return this.hojas.agregar(ingresoId, body.especialidadId);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('ingresos/:ingresoId/:hojaId/archivar')
  archivar(
    @Param('ingresoId', ParseIntPipe) ingresoId: number,
    @Param('hojaId', ParseIntPipe) hojaId: number
  ) {
    return this.hojas.archivar(ingresoId, hojaId);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Put('ingresos/:ingresoId/:hojaId')
  guardar(
    @Param('ingresoId', ParseIntPipe) ingresoId: number,
    @Param('hojaId', ParseIntPipe) hojaId: number,
    @Body() body: GuardarHojaEspecialidadDto
  ) {
    return this.hojas.guardar(ingresoId, hojaId, body);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Get('ingresos/:ingresoId/:hojaId/versiones')
  historial(
    @Param('ingresoId', ParseIntPipe) ingresoId: number,
    @Param('hojaId', ParseIntPipe) hojaId: number
  ) {
    return this.hojas.historial(ingresoId, hojaId);
  }
}
