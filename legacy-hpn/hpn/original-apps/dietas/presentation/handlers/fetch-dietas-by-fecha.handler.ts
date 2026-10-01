import {
  FetchDietasByFechaImpl,
  FetchPacientesBySubgrupoImpl,
} from '@hpn/ori/die/infrastructure/services';
import { DieCentroOrm } from '@hpn/ori/die/infrastructure/models/local';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FetchDietasByFechaHandler {
  constructor(
    private _fetchDietasByFecha: FetchDietasByFechaImpl,
    private _fetchPacientesBySubgrupo: FetchPacientesBySubgrupoImpl
  ) {}

  public async fetchPacientesBySubgrupo(
    centroId: number,
    horarioId: number,
    subgrupoCode: string,
    fechaJornada: Date
  ) {
    try {
      return await this._fetchPacientesBySubgrupo.execute(
        centroId,
        horarioId,
        subgrupoCode,
        fechaJornada
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public execute(fecha: Date): Promise<any> {
    try {
      return this._fetchDietasByFecha.dietasByFecha(fecha);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async byRange(fechas: Date[]): Promise<{ fecha: string; data: DieCentroOrm[] }[]> {
    try {
      const finalData: any[] = [];

      for (let i = 0; i < fechas.length; i++) {
        const result = await this._fetchDietasByFecha.dietasByFecha(fechas[i]);
        finalData.push({ fecha: fechas[i].toISOString().split('T')[0], data: result });
      }

      return finalData;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
