import { CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { FormatoMuestrasAnatomopatologicasImpl } from '../infraestructure/services';

@CommonGuards()
@Controller('v1/formato-muestras-anatomopatologicas')
export class FormatoMuestrasAnatomopatologicasController {
  constructor(private _buscarPacienteImpl: FormatoMuestrasAnatomopatologicasImpl) {}
  @Get('buscar-paciente/:documento')
  public async buscarPaciente(@Param('documento') documento: string) {
    try {
      return await this._buscarPacienteImpl.buscarPaciente(documento);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
