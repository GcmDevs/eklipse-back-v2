import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { TurnoSource } from '@gestion-clinica/entrega-turnos/infrastructure/repositories';
import {
  CreateTurnoDto,
  CreateEntregaTurnoDto,
  CreateRecibeTurnoDto,
  fetchTurnoDto,
  HabilitaRTurnoDto,
} from '../dtos/create-entrega-turno';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';

@CommonGuards()
@Controller('v4/entrega-turnos')
export class TurnoController {
  constructor(private _turnoSource: TurnoSource) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('create-turno')
  public create(@Body() body: CreateTurnoDto) {
    try {
      const result = this._turnoSource.create(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('habilitar-turno')
  public habilitarTurno(@Body() body: HabilitaRTurnoDto) {
    try {
      const result = this._turnoSource.habilitarTurno(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTION_TURNO])
  @Get('all')
  public fetchTurnosByRangoFecha(@Query() body: fetchTurnoDto) {
    try {
      const result = this._turnoSource.fetchTurnosByRangoFecha(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTION_TURNO])
  @Get('actual')
  public findTurnoBySubgrupoId() {
    try {
      const result = this._turnoSource.findTurnoBySubgrupoId();
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('entrega')
  public entrega(@Body() body: CreateEntregaTurnoDto) {
    try {
      const result = this._turnoSource.entrega(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('recibe')
  public recibe(@Body() body: CreateRecibeTurnoDto) {
    try {
      const result = this._turnoSource.recibe(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
