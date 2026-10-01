import { BadRequestException, Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ReferenciaSource } from './referencia.source';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { GcmContexts } from '@common/application/constants';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v1/hpn/referencia')
export class ReferenciaController {
  constructor(private _valCriCrud: ReferenciaSource) {}

  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Get()
  public fetchByPattern(
    @Query('pattern') pattern: string,
    @Query('origen') origen: 1 | 2,
    @Query('ctx') context: GcmContexts
  ) {
    return this._valCriCrud.fetchByPattern(pattern, origen, context);
  }

  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Put('reservar-cama')
  public reservarCama(
    @Body()
    payload: {
      context: GcmContexts;
      camaId: number;
      consecutivo: number;
      origen: 1 | 2;
      tipoAislamiento?: number[];
      observacion: string;
    }
  ) {
    if (!payload.context || !payload.camaId || !payload.consecutivo || !payload.origen) {
      throw new BadRequestException('Uno o mas campos obligatorios faltan');
    }
    try {
      return this._valCriCrud.reservarCama(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Put('anular-reserva-cama')
  public anularReservaCama(
    @Body()
    payload: {
      context: GcmContexts;
      camaId: number;
      consecutivo: number;
      origen: number;
      motivo: number;
      observacion: string;
    }
  ) {
    try {
      return this._valCriCrud.anularReservaCama(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Get('alert-reservas')
  public alertReservas(@Query('ctx') context: GcmContexts) {
    try {
      return this._valCriCrud.alertReservas(context);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
