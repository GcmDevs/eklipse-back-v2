import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SumPacModifiRecibiPayload, SumPacRecibidoPayload } from '../dtos';
import { INN_AUTHORITIES } from '@inn/authorities';
import {
  ModificarSuministrosRecibidosImpl,
  SuministrosListosParaEntregaImpl,
  RecibirSuministrosImpl,
} from '../../infrastructure/services';

@ApiTags('Entregar/recibir')
@CommonGuards()
@Controller('v1/inn/suministros-paciente')
export class SuministrosController {
  constructor(
    private _suministrosListosEntrega: SuministrosListosParaEntregaImpl,
    private _recibir: RecibirSuministrosImpl,
    private _modificarRecibidos: ModificarSuministrosRecibidosImpl
  ) {}

  @Authorities([INN_AUTHORITIES.SUMINISTROS.RECIBIR])
  @Get('listo-para-entrega/:ordenSuministrosId')
  async suministrosListosParaEntrega(
    @Param('ordenSuministrosId') ordenSuministrosId: number
  ): Promise<boolean> {
    try {
      return this._suministrosListosEntrega.execute(+ordenSuministrosId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SUMINISTROS.RECIBIR])
  @Put('recibir')
  async recibirSuministros(
    @Body() payload: SumPacRecibidoPayload[],
    @Query('despachadorId') despachadorId: string
  ): Promise<boolean> {
    try {
      return this._recibir.execute(payload, despachadorId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SUMINISTROS.RECIBIR])
  @Put('modificar-recibidos')
  async modificarSuministrosRecibidos(
    @Body() payload: SumPacModifiRecibiPayload
  ): Promise<boolean> {
    try {
      return this._modificarRecibidos.execute(payload);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
