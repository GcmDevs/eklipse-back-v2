import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { TrasladoEvolucionImpl } from '@hpn/lgc/tas/infrastructure/repositories';
import {
  CreateMedicamentoDto,
  CreateNotaTrasladoDto,
  CreateProcedimientoDto,
  CreateProcedimientosListaDto,
  CreateSignosVitalesDto,
  CreateUltimaVeZVistoBienDto,
} from '../dtos';
import { HPN_AUTHORITIES } from '@authorities';
import { GcmContextCode } from '@common/domain/types';

@ApiTags('Traslados Asistenciales')
@ApiBearerAuth()
@CommonGuards()
@Controller('v1/hpn/traslados-asistenciales/monitoreo')
export class TrasladoMonitoreoController {
  constructor(private _source: TrasladoEvolucionImpl) {}

  @ApiOperation({ summary: 'Registrar signos vitales durante el monitoreo' })
  @Authorities([
    HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO,
    HPN_AUTHORITIES.GESTION_CLINICA.AGREGAR_TRASLADO,
  ])
  @Post('signos-vitales')
  public createSignosVitales(@Body() body: CreateSignosVitalesDto) {
    try {
      // Payload esperado en monitoreo: { signosVitales: { ta, fc, fr, sato2, fcf, glasgow } }
      return this._source.addSignosVitales(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Registrar una nota durante el monitoreo' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO])
  @Post('nota')
  public createNota(@Body() body: CreateNotaTrasladoDto) {
    try {
      return this._source.createNota(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Registrar un procedimiento durante el monitoreo' })
  @Authorities([
    HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO,
    HPN_AUTHORITIES.GESTION_CLINICA.AGREGAR_TRASLADO,
  ])
  @Post('procedimientos')
  public createProcedimiento(@Body() body: CreateProcedimientoDto) {
    try {
      return this._source.createProcedimiento(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Registrar un medicamento administrado durante el monitoreo' })
  @Authorities([
    HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO,
    HPN_AUTHORITIES.GESTION_CLINICA.AGREGAR_TRASLADO,
  ])
  @Post('medicamentos')
  public createMedicamento(@Body() body: CreateMedicamentoDto) {
    try {
      return this._source.createMedicamento(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Registrar la última vez que se vio al paciente bien' })
  @Authorities([
    HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO,
    HPN_AUTHORITIES.GESTION_CLINICA.AGREGAR_TRASLADO,
  ])
  @Post('ultima-vez-visto-bien')
  public createUltimaVeZVistoBien(@Body() body: CreateUltimaVeZVistoBienDto) {
    try {
      return this._source.createUltimaVeZVistoBien(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Obtener el historial de monitoreo de un traslado' })
  @Authorities([
    HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO,
    HPN_AUTHORITIES.GESTION_CLINICA.AGREGAR_TRASLADO,
    HPN_AUTHORITIES.GESTION_CLINICA.GESTION_TRASLADO,
  ])
  @Get('historial')
  public async getHistorialMonitoreo(
    @Query('trasladoId') trasladoId: number,
    @Query('vehiculoId') vehiculoId: number,
    @Query('contextoCode') contextoCode: GcmContextCode
  ) {
    try {
      return await this._source.getHistorialMonitoreo(+trasladoId, +vehiculoId, contextoCode);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Registrar un procedimiento durante el monitoreo' })
  @Authorities([
    HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO,
    HPN_AUTHORITIES.GESTION_CLINICA.AGREGAR_TRASLADO,
  ])
  @Post('add-lista-procedimiento')
  public createProcedimientosLista(@Body() body: CreateProcedimientosListaDto) {
    try {
      return this._source.createProcedimientosLista(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
