import { Injectable, BadRequestException } from '@nestjs/common';
import { InterConsultaPendienteDto } from '@hcn/ori/intc/application/data-transfers';
import { FetchInterconsultasPendientesService } from '@hcn/ori/intc/application/services';

@Injectable()
export class FetchInterconsultasPendientesHandler {
  constructor(private _fetchInterconsultasPendientes: FetchInterconsultasPendientesService) {}

  public async all(): Promise<InterConsultaPendienteDto[]> {
    try {
      const result = await this._fetchInterconsultasPendientes.all();

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async porEspecialidadUsuarioAutenticado(): Promise<InterConsultaPendienteDto[]> {
    try {
      const result = await this._fetchInterconsultasPendientes.porEspecialidadUsuarioAutenticado();

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
