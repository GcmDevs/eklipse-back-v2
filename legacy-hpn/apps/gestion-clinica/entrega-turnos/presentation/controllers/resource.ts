import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import {
  RecursosImpl,
  TemporalesImpl,
} from '@gestion-clinica/entrega-turnos/infrastructure/repositories';
import { AsignarPacienteTemporalDto } from '../dtos';

@CommonGuards()
@Controller('v4/entrega-turnos/recursos')
export class RecursosController {
  constructor(
    private _resourceByPattern: RecursosImpl,
    private _temporales: TemporalesImpl
  ) {}

  @Get('indicaciones-medicas-by-ingresoId')
  public fetchIndicacionesMedicasByIngreso(@Query('ingresoId') ingresoId: number) {
    try {
      const result = this._resourceByPattern.fetchIndicacionesMedicasByIngreso(ingresoId);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('pacientes-by-subgrupo')
  public fetch(@Query('centroId') centroId: string, @Query('subgrupoCode') subgrupoCode: string) {
    try {
      const result = this._resourceByPattern.fetchPacientesHpnBySubgrupo(centroId, subgrupoCode);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('temporales-by-centro')
  public temporalesDisponibles(@Query('centroId') centroId: number) {
    return this._temporales.disponibles(+centroId);
  }

  @Post('temporales/asignar')
  public asignarTemporal(@Body() body: AsignarPacienteTemporalDto) {
    return this._temporales.asignar(body.centroId, body.subgrupoDestinoId, body.ingresoId);
  }

  @Delete('temporales/:asignacionId')
  public retirarTemporal(
    @Param('asignacionId') asignacionId: number,
    @Query('centroId') centroId: number,
    @Query('subgrupoDestinoId') subgrupoDestinoId: number
  ) {
    return this._temporales.retirar(+centroId, +subgrupoDestinoId, +asignacionId);
  }

  @Get('subgrupos-by-pattern')
  public subgruposByPattern(@Query('centroId') centroId: string) {
    try {
      const result = this._resourceByPattern.fetchSubGrupoByPattern(centroId);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('medico-by-pattern')
  public medicoByPattern(@Query('pattern') pattern: string) {
    try {
      const result = this._resourceByPattern.fetchMedicoByPattern(pattern);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
