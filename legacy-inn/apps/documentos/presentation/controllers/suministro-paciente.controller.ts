import { Get, Controller, BadRequestException, Query } from '@nestjs/common';
import { OrdenDespachoSource } from '@documentos/infrastructure/repositories';
import { CommonGuards } from '@common/presentation/decorators';
import { GcmContextCode } from '@common/domain/types';

@CommonGuards()
@Controller('v4/documentos/suministros-paciente')
export class SuministroPacienteController {
  constructor(private _suministroPaciente: OrdenDespachoSource) {}

  @Get('by-pattern-and-centro')
  async fetchActivos(
    @Query('pattern') pattern: string,
    @Query('contextCode') contextCode: GcmContextCode,
    @Query('isTrasladoProducto') isTrasladoProducto: boolean
  ) {
    try {
      return await this._suministroPaciente.fetchOrdenDespachoByCentroAndPatternAndDocumento(
        pattern,
        contextCode,
        isTrasladoProducto
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
