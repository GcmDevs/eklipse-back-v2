import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { PacienteTrazadorRes, PacTrazRespuestaRes } from '@hpn/pacientes/application/responses';
import { RespuestaPacienteTrazadorDto } from '../dtos';
import {
  PacTrazAvancesEncuestaImpl,
  PacTrazFetchPacientesPreAltaImpl,
  PacTrazRealizarEncuestaImpl,
} from '@hpn/pacientes/infrastructure/services';

@Controller('v1/hpn/paciente-trazador')
@CommonGuards()
export class EncuestaController {
  constructor(
    private _fetchPacientesPreAlta: PacTrazFetchPacientesPreAltaImpl,
    private _realizarEncuesta: PacTrazRealizarEncuestaImpl,
    private _avancesEncuesta: PacTrazAvancesEncuestaImpl
  ) {}

  @ApiOperation({ summary: 'Busca los pacientes que están pre alta.' })
  @ApiResponse({ status: 200, isArray: true, type: PacienteTrazadorRes })
  @Get('fetch-pacientes-pre-alta')
  async fetchPacientesPreAlta(): Promise<PacienteTrazadorRes[]> {
    try {
      return await this._fetchPacientesPreAlta.execute();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  @ApiOperation({ summary: 'Registra las respuestas dee la encuesta uno por uno.' })
  @ApiResponse({ status: 201, description: 'Respuesta almacenada exitosamente.' })
  @Post('encuesta/one-by-one')
  async realizarEncuesta(@Body() body: RespuestaPacienteTrazadorDto) {
    try {
      return await this._realizarEncuesta.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Devuelve los valores respondidos en la encuesta.' })
  @ApiResponse({ status: 200, isArray: true, type: PacTrazRespuestaRes })
  @ApiQuery({ name: 'addInfoAdicional', required: false })
  @Get('encuesta/avances/:pacienteId/:ingresoId')
  async avancesEncuesta(
    @Param('pacienteId') pacienteId: number,
    @Param('ingresoId') ingresoId: number,
    @Query('addInfoAdicional') addInfoAdicional: boolean
  ): Promise<PacTrazRespuestaRes[]> {
    try {
      return await this._avancesEncuesta.execute(+pacienteId, +ingresoId, addInfoAdicional);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
