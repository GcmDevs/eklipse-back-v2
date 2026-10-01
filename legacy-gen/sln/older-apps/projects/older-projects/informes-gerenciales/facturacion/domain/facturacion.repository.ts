import { GcmContexts } from '@common/application/constants';
import { FacturacionPeriodoModel, FacturacionTerceroMesModel } from './models';
import { ResumenPeriodoEntidadesModel, ResumenPeriodoModel } from './models/resumen-periodo.model';

export interface FacturacionRepository {
  getFacturacionPeriodo(inicio: Date, final: Date): Promise<FacturacionPeriodoModel>;

  getResumenPeriodo(inicio: Date, final: Date, centroId: number): Promise<ResumenPeriodoModel[]>;

  getResumenPeriodoPorEntidad(inicio: Date, final: Date): Promise<ResumenPeriodoEntidadesModel[]>;

  getFacturacionTerceros(
    inicio: Date,
    final: Date,
    centroId: number,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]>;

  getFacturacionTercerosByCentro(
    inicio: Date,
    final: Date,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]>;

  getFacturacionEntidadesByCentro(payload: {
    inicio: Date;
    final: Date;
    centroId: number;
    terceroId: number;
    byDay: boolean;
    context: GcmContexts;
  }): Promise<FacturacionTerceroMesModel[]>;

  getFacturacionEntidades(
    inicio: Date,
    final: Date,
    centroId: number,
    terceroId: number,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]>;
}
