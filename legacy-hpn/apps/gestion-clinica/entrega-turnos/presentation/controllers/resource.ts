import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import { RecursosImpl } from '@gestion-clinica/entrega-turnos/infrastructure/repositories';

@CommonGuards()
@Controller('v4/entrega-turnos/recursos')
export class RecursosController {
  constructor(private _resourceByPattern: RecursosImpl) {}

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
