import { Get, Controller, BadRequestException, Query } from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import { AfnRecursosImpl } from '@activos-fijos/infrastructure/services';

@CommonGuards()
@Controller('v4/afn/recursos')
export class AfnRecursosController {
  constructor(private _recursos: AfnRecursosImpl) {}

  @Get('activos')
  async fetchActivos(@Query('pattern') pattern: string) {
    try {
      return await this._recursos.fetchActivos(pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('pacientes-by-ingreso')
  async fetchPacientesByIngreso(@Query('pattern') pattern: string) {
    try {
      return await this._recursos.fetchPacientes(pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
