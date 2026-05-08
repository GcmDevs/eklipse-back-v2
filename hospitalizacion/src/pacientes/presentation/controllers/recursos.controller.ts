import { BadRequestException, Controller, Get } from '@nestjs/common';
import { FetchPacientesHospitalizadosImpl } from '@hpn/pacientes/infrastructure/services';
import { CommonGuards } from '@common/presentation/decorators';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PacienteHospitalizadoRes } from '@hpn/pacientes/application/responses';

@ApiTags('Recursos')
@CommonGuards()
@Controller('v1/hpn/recursos')
export class RecursosController {
  constructor(private _fetchHospitalizados: FetchPacientesHospitalizadosImpl) {}

  @ApiResponse({ type: PacienteHospitalizadoRes, isArray: true })
  @Get('fetch-pacientes-hospitalizados')
  fetchPacientesHospitalizados(): Promise<PacienteHospitalizadoRes[]> {
    try {
      return this._fetchHospitalizados.execute();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
