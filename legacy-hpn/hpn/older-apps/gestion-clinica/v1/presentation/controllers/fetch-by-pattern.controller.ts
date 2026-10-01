import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import {
  DepartamentoByPatternService,
  MunicipioByPatternService,
  ServicioByPatternService,
  VehiculoByPatternService,
  motTrasladoByPatternService,
} from '@hpn/gestion-clinica/v1/infrastructure/services';
import { EntidadByPatternService } from '@hpn/gestion-clinica/v1/infrastructure/services';
import { EmpleadoByPatternService } from '@hpn/gestion-clinica/v1/infrastructure/services/empleado-by-pattern';
import { TipoEmpleadoCode } from '../../domain/types';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v1/hpn/gestion-clinica')
export class FetchByPatternController {
  constructor(
    private _motTrasladoPatternService: motTrasladoByPatternService,
    private _deptoByPatternService: DepartamentoByPatternService,
    private _municipioByPatternService: MunicipioByPatternService,
    private _entidadByPatternService: EntidadByPatternService,
    private _empleadoByPatternService: EmpleadoByPatternService,
    private _vehiculoByPatternService: VehiculoByPatternService,
    private _servicioByPatternService: ServicioByPatternService
  ) {}

  @Get('by-pattern-mot-traslado')
  public async fetchPatternMotTraslado(@Query('pattern') pattern: string) {
    try {
      const response = await this._motTrasladoPatternService.fetchByPattern(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('by-pattern-depto')
  public async fetchPatternDepto(@Query('pattern') pattern: string) {
    try {
      const response = await this._deptoByPatternService.fetchByPattern(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('by-pattern-muni')
  public async fetchPatternMnucipio(
    @Query('pattern') pattern: string,
    @Query('codDepto') codDepto: string
  ) {
    try {
      const response = await this._municipioByPatternService.fetchByPattern(pattern, codDepto);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('by-pattern-entidad')
  public async fetchPatternEntidad(@Query('pattern') pattern: string) {
    try {
      const response = await this._entidadByPatternService.fetchByPattern(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('by-pattern-empleado')
  public async fetchPatternEmpleado(
    @Query('pattern') pattern: string,
    @Query('tipoUsuario') tipoUsuario: TipoEmpleadoCode
  ) {
    try {
      const response = await this._empleadoByPatternService.fetchByPattern(pattern, tipoUsuario);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('by-pattern-vehiculo')
  public async fetchPatternVehiculo(@Query('pattern') pattern: string) {
    try {
      const response = await this._vehiculoByPatternService.fetchByPattern(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('by-pattern-asig-vehiculos')
  public async fetchAsignacionesVehiculos(@Query('pattern') pattern: string) {
    try {
      const response = await this._vehiculoByPatternService.fetchByPatternAndEmpleados(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('by-pattern-servicios')
  public async ServicioByPatternService(@Query('pattern') pattern: string) {
    try {
      const response = await this._servicioByPatternService.fetchByPattern(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
