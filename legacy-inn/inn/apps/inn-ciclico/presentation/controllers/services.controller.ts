import { BadRequestException, Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UpdateExistenciaEstanteDto, VerificarEstanteDto } from '@inn/ciclico/application/dtos';
import {
  FetchHistoricoReporteExistenciaProductoImpl,
  HistoricoVerificacionEstanteImpl,
  UpdateExistenciaProductoImpl,
  VerificarEstanteImpl,
} from '@inn/ciclico/infrastructure/services';

@Controller('v3/inn-ciclico')
export class InnCiclicoServicesController {
  constructor(
    private _fetchHistoExistProd: FetchHistoricoReporteExistenciaProductoImpl,
    private _fetchHistoricoVerifi: HistoricoVerificacionEstanteImpl,
    private _updateExistencias: UpdateExistenciaProductoImpl,
    private _verificarEstante: VerificarEstanteImpl
  ) {}

  @Get('historico/:productoId/:estanteId')
  async fetchHistorico(
    @Param('productoId') productoId: number,
    @Param('estanteId') estanteId: number
  ) {
    try {
      return await this._fetchHistoExistProd.execute(+productoId, +estanteId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('update-existencia/:estanteId')
  async updateExistencia(
    @Param('estanteId') estanteId: number,
    @Body() body: UpdateExistenciaEstanteDto[]
  ) {
    try {
      return await this._updateExistencias.execute(+estanteId, body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('verificar/:estanteId')
  async verificar(@Param('estanteId') estanteId: number, @Body() body: VerificarEstanteDto) {
    try {
      return await this._verificarEstante.execute(+estanteId, body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('verificar/historico/:estanteId')
  async fetchHistoricoVerificaciones(@Param('estanteId') estanteId: number) {
    try {
      return await this._fetchHistoricoVerifi.execute(+estanteId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
