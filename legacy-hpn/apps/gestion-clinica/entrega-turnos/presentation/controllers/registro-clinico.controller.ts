import { BadRequestException, Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import {
  CreateOrUpdateEvolucionDto,
  CreateRegistroClinicoDto,
  UpdateRegistroClinicoDto,
} from '../dtos/create-entrega-turno';
import { RegistroClinicoImpl } from '@gestion-clinica/entrega-turnos/infrastructure/repositories/registro-clinico';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';

@CommonGuards()
@Controller('v4/entrega-turnos/registro-clinico')
export class RegistroClinicoController {
  constructor(private _registroSource: RegistroClinicoImpl) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Get(':pacienteId')
  public findRegistrosClinicosByTurnoIds(@Param('pacienteId') pacienteId: number) {
    try {
      const result = this._registroSource.getRegistrosClinicosByPacienteId(pacienteId);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Get('turno/:turnoId')
  public getRegistosClinicosByTurnoId(@Param('turnoId') turnoId: number) {
    try {
      const result = this._registroSource.getRegistrosClinicosByTurnoId(turnoId);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('create-or-update-evolucion')
  public createOrUpdateEvolucion(@Body() body: CreateOrUpdateEvolucionDto) {
    try {
      const result = this._registroSource.createOrUpdateEvolucion(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('create')
  public create(@Body() body: CreateRegistroClinicoDto) {
    try {
      const result = this._registroSource.create(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Put('update')
  public update(@Body() body: UpdateRegistroClinicoDto) {
    try {
      const result = this._registroSource.update(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
