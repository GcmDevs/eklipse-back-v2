import { INN_AUTHORITIES } from '@inn/authorities';
import { BaseApiResponse } from '@common/domain/types';
import { Authorities } from '@common/presentation/decorators';
import { BaseShelteredController } from '@common/presentation/controllers';
import { TipoAmbulanciaFlota } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { AmbulanciaView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { AmbulanciaFlotaService } from '@inn/operaciones/turnos-vehiculos/application/services/ambulancia-flota.service';
import { DotacionService } from '@inn/operaciones/turnos-vehiculos/application/services/dotacion.service';
import { PlantillaService } from '@inn/operaciones/turnos-vehiculos/application/services/plantilla.service';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import {
  CreateAmbulanciaFlotaDto,
  CrearPlantillaVersionDto,
  EnServicioDto,
  FueraServicioDto,
  UpsertVencimientoDto,
} from '../dto/flota.dto';
import { DotacionGrillaItemsQueryDto } from '../dto/flota-search.dto';

@Controller('/v4/inn/amb')
export class AmbulanciaFlotaController extends BaseShelteredController {
  constructor(
    private readonly ambService: AmbulanciaFlotaService,
    private readonly dotacionService: DotacionService,
    private readonly plantillaService: PlantillaService,
  ) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/ambulancias/:vehiculoId/dotaciones/grilla')
  async grillaDotacionItems(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Query() query: DotacionGrillaItemsQueryDto,
  ) {
    return { data: await this.dotacionService.buildGrillaItems(vehiculoId, query.mes, query.anio) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/ambulancias')
  async listar(
    @Query('search') search?: string,
    @Query('estadoServicio') estadoServicio?: string,
  ): Promise<BaseApiResponse<AmbulanciaView[]>> {
    return { data: await this.ambService.listar(search, estadoServicio) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Post('/ambulancias')
  async registrar(@Body() dto: CreateAmbulanciaFlotaDto): Promise<BaseApiResponse<AmbulanciaView>> {
    return {
      data: await this.ambService.registrar(dto.activoId, dto.tipoAmbulancia as TipoAmbulanciaFlota),
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Post('/ambulancias/:vehiculoId/fuera-servicio')
  async fueraServicio(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Body() dto: FueraServicioDto,
  ): Promise<BaseApiResponse<AmbulanciaView>> {
    return { data: await this.ambService.fueraServicio(vehiculoId, dto.motivo, dto.evidencia) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Post('/ambulancias/:vehiculoId/en-servicio')
  async enServicio(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Body() dto: EnServicioDto,
  ): Promise<BaseApiResponse<AmbulanciaView>> {
    return { data: await this.ambService.enServicio(vehiculoId, dto.observacion) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/ambulancias/:vehiculoId/vencimientos')
  async listarVencimientos(@Param('vehiculoId', ParseIntPipe) vehiculoId: number) {
    return { data: await this.dotacionService.listarVencimientos(vehiculoId) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Put('/ambulancias/:vehiculoId/vencimientos/:itemKey')
  async vencimiento(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Param('itemKey') itemKey: string,
    @Body() dto: UpsertVencimientoDto,
  ): Promise<BaseApiResponse<void>> {
    await this.ambService.upsertVencimiento(vehiculoId, itemKey, dto.fechaVencimiento);
    return { data: undefined };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Get('/plantillas/:formato/vigente')
  async plantillaVigente(@Param('formato') formato: string) {
    return { data: await this.plantillaService.getVigente(this.plantillaService.parseFormato(formato)) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Get('/plantillas/:formato/versiones')
  async plantillaVersiones(@Param('formato') formato: string) {
    return { data: await this.plantillaService.listVersiones(this.plantillaService.parseFormato(formato)) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR])
  @Post('/plantillas/:formato/versiones')
  async crearPlantilla(@Param('formato') formato: string, @Body() dto: CrearPlantillaVersionDto) {
    return {
      data: await this.plantillaService.crearVersion(
        this.plantillaService.parseFormato(formato),
        dto.estructura as any,
      ),
    };
  }
}
