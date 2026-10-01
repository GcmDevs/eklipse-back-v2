import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get } from '@nestjs/common';
import { RecordatorioCitasImpl } from '../../../infrastructure/services/recordatorio-citas.impl';
import { RecordatorioResponse } from '../../../domain/models';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';

@CommonGuards()
@Controller('/v4/api/recordatorio-citas')
export class RecordatorioCitasController {
  constructor(private _recordatorioCitas: RecordatorioCitasImpl) {}

  @Authorities([HPN_AUTHORITIES.APIS.RECORDATORIO_CITAS])
  @Get()
  async getRecordatorioCitas(): Promise<RecordatorioResponse> {
    try {
      return this._recordatorioCitas.getRecordatorioCitas();
    } catch (error) {
      console.error('Error procesando los recordatorios:', error);
      throw new BadRequestException(error.message);
    }
  }
}
