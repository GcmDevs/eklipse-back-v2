import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { GcmContexts } from '@common/application/constants';
import { GestionSalidaSource } from './gestion-salida.source';
import { GestionSalidaDto } from '../camas/application/dtos';

@CommonGuards()
@Controller('v1/hpn/gestion-salida')
export class GestionSalidaController {
  constructor(private _gestionsSalida: GestionSalidaSource) {}

  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Get()
  public fetchByConsecutivo(
    @Query('consecutivo') consecutivo: number,
    @Query('ctx') context: GcmContexts
  ) {
    return this._gestionsSalida.getConsecutivoSalida(consecutivo, context);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Get('all')
  public fetchAll() {
    return this._gestionsSalida.fetchAll();
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Post('confirmar-salida')
  public aprobarSalida(
    @Body()
    body: GestionSalidaDto,
    @Query('ctx') context: GcmContexts
  ) {
    return this._gestionsSalida.aprobarSalida(body, context);
  }
}
