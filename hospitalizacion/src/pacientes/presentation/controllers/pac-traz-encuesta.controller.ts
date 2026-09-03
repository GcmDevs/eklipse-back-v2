import { BadRequestException, Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import {
  PacienteTrazadorRes,
  PacTrazAvancesEncuestaRes,
  PacTrazRespuestaRes,
} from '@hpn/pacientes/application/responses';
import { RespuestaPacienteTrazadorDto } from '../dtos';
import {
  PacTrazAvancesEncuestaImpl,
  PacTrazFetchPacientesPreAltaImpl,
  PacTrazRealizarEncuestaImpl,
  PacTrazListarAuditoresImpl,
  PacTrazGenerarInformePdfImpl,
} from '@hpn/pacientes/infrastructure/services';

@Controller('v1/hpn/paciente-trazador')
@CommonGuards()
export class EncuestaController {
  constructor(
    private _fetchPacientesPreAlta: PacTrazFetchPacientesPreAltaImpl,
    private _realizarEncuesta: PacTrazRealizarEncuestaImpl,
    private _avancesEncuesta: PacTrazAvancesEncuestaImpl,
    private _listarAuditores: PacTrazListarAuditoresImpl,
    private _generarInformePdf: PacTrazGenerarInformePdfImpl
  ) {}

  @ApiOperation({ summary: 'Busca los pacientes que están pre alta.' })
  @ApiResponse({ status: 200, isArray: true, type: PacienteTrazadorRes })
  @Get('fetch-pacientes-pre-alta')
  async fetchPacientesPreAlta(): Promise<PacienteTrazadorRes[]> {
    try {
      return await this._fetchPacientesPreAlta.execute();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Lista usuarios activos disponibles para conformar el equipo auditor.' })
  @Get('auditores')
  async listarAuditores() {
    return this._listarAuditores.execute();
  }

  @ApiOperation({ summary: 'Genera el informe PDF de la auditoría del paciente trazador.' })
  @Get('encuesta/informe/:pacienteId/:ingresoId/pdf')
  async generarInformePdf(
    @Param('pacienteId') pacienteId: number,
    @Param('ingresoId') ingresoId: number,
    @Res() response: Response
  ): Promise<void> {
    const pdf = await this._generarInformePdf.execute(+pacienteId, +ingresoId);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="paciente-trazador-${pacienteId}.pdf"`);
    response.send(pdf);
  }

  @ApiOperation({ summary: 'Registra las respuestas de la encuesta uno por uno.' })
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
  @ApiResponse({ status: 200, type: PacTrazAvancesEncuestaRes })
  @ApiQuery({ name: 'addInfoAdicional', required: false })
  @Get('encuesta/avances/:pacienteId/:ingresoId')
  async avancesEncuesta(
    @Param('pacienteId') pacienteId: number,
    @Param('ingresoId') ingresoId: number,
    @Query('addInfoAdicional') addInfoAdicional: boolean
  ): Promise<PacTrazAvancesEncuestaRes> {
    try {
      return await this._avancesEncuesta.execute(+pacienteId, +ingresoId, addInfoAdicional);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
