import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { RecibirSuministrosAuthUnreqImpl } from '../../infrastructure/services';
import { GcmContextCode } from '@common/domain/types';
import { SumPacModifiRecibiDto } from '../dtos';

@ApiTags('Entregar/recibir')
@Controller('v1/inn/suministros-paciente')
export class SuministrosAuthUnreqController {
  constructor(private _services: RecibirSuministrosAuthUnreqImpl) {}

  @Get('find-by-consecutivo/:consecutivo/:lessDays')
  async findByConsecutivo(
    @Param('consecutivo') consecutivo: number,
    @Param('lessDays') lessDays: number,
    @Query('contextCode') contextCode: GcmContextCode
  ) {
    return this._services.findByConsecutivo(+consecutivo, +lessDays, contextCode);
  }

  @Get('find-by-pattern/:pattern/:lessDays')
  async findByPattern(
    @Param('pattern') pattern: string,
    @Param('lessDays') lessDays: number,
    @Query('contextCode') contextCode: GcmContextCode
  ) {
    return this._services.findByPattern(pattern, +lessDays, contextCode);
  }

  @Get('info-modificacion-suministros-recibidos/:id')
  async informacionModificacionSuministrosRecibidos(
    @Param('id') id: number,
    @Query('contextCode') contextCode: GcmContextCode
  ): Promise<SumPacModifiRecibiDto> {
    return this._services.findModificacionSuministrosRecibidosByOrdenSuministroId(+id, contextCode);
  }
}
