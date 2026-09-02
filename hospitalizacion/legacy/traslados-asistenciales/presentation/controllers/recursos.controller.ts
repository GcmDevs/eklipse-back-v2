import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { TrasladoRecursosImpl } from '@hpn/lgc/tas/infrastructure/repositories';
import { TipoEmpleadoCode } from '@hpn/lgc/tas/types/gcn';

@ApiTags('Traslados Asistenciales')
@ApiBearerAuth()
@CommonGuards()
@Controller('v1/hpn/traslados-asistenciales/recursos')
export class TrasladoRecursosController {
  constructor(private _trasladoService: TrasladoRecursosImpl) {}

  @ApiOperation({ summary: 'Buscar pacientes por patrón de búsqueda' })
  @Get('pacientes-by-pattern')
  public pacienteByPattern(
    @Query('pattern') pattern: string,
    @Query('onlyActivos') onlyActivos: boolean = true
  ) {
    try {
      const result = this._trasladoService.fetchPacientesByPattern(pattern, onlyActivos);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Buscar instituciones por patrón de búsqueda' })
  @Get('instituciones-by-pattern')
  public institucionesByPattern(@Query('pattern') pattern: string) {
    try {
      const result = this._trasladoService.fetchInstitucionesByPattern(pattern);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @ApiOperation({ summary: 'Buscar municipios por patrón de búsqueda' })
  @Get('municipios-by-pattern')
  public municipiosByPattern(@Query('pattern') pattern: string) {
    try {
      const result = this._trasladoService.fetchMunicipiosByPattern(pattern);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Buscar usuarios por patrón de búsqueda y tipo de empleado' })
  @Get('usuario-by-pattern')
  public usuarioByPattern(
    @Query('pattern') pattern: string,
    @Query('tipoCode') tipoCode: TipoEmpleadoCode
  ) {
    try {
      const result = this._trasladoService.fetchUsuarioByPattern(pattern, tipoCode);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @ApiOperation({ summary: 'Buscar vehículos por patrón de búsqueda' })
  @Get('vehiculos-by-pattern')
  public vehiculoByPattern(@Query('pattern') pattern: string) {
    try {
      const result = this._trasladoService.fetchVehiculosByPattern(pattern);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @ApiOperation({ summary: 'Buscar servicios por patrón de búsqueda' })
  @Get('servicios-by-pattern')
  public servicioByPattern(@Query('pattern') pattern: string) {
    try {
      const result = this._trasladoService.fetchServiciosByPattern(pattern);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @ApiOperation({ summary: 'Buscar medicamentos por patrón de búsqueda' })
  @Get('medicamentos-by-pattern')
  public medicamentosByPattern(@Query('pattern') pattern: string) {
    try {
      const result = this._trasladoService.fetchMedicamentosByPattern(pattern);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @ApiOperation({ summary: 'Buscar diagnósticos por patrón de búsqueda' })
  @Get('diagnosticos-by-pattern')
  public diagnosticosByPattern(@Query('pattern') pattern: string) {
    try {
      const result = this._trasladoService.fetchDiagnosticosByPattern(pattern);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Buscar procedimientos por patrón de búsqueda' })
  @Get('procedimientos-by-pattern')
  public procedimientosByPattern(@Query('pattern') pattern: string) {
    try {
      const result = this._trasladoService.fetchProcedimientosByPattern(pattern);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
