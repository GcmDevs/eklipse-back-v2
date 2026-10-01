import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { PacHospiRes, PacienteHospiRes } from '@gen/pacientes/infrastructure/responses';
import { FetchPacientesImpl } from '../../infrastructure/services';
import { CommonGuards } from '@common/presentation/decorators';

@ApiTags('Pacientes')
@CommonGuards()
@Controller('v1/gen/pacientes')
export class FetchPacientesController {
  constructor(private _services: FetchPacientesImpl) {}

  @ApiOkResponse({ type: PacHospiRes, isArray: true })
  @ApiQuery({ name: 'pattern', required: false })
  @Get('v1/gen/pacientes/hospitalizados/suggestions')
  public hospitalizados(@Query('pattern') pattern: string) {
    try {
      return this._services.hospitalizados(undefined, pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: PacienteHospiRes, isArray: true })
  @ApiQuery({ name: 'pattern', required: false })
  @Get('suggestions')
  public execute(@Query('pattern') pattern: string) {
    try {
      return this._services.execute(pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
