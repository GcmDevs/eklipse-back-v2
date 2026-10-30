import { LecturaOdometro } from '../entities';
import { LecturaOdometroRead } from '../reads/lectura-odometro.read';

export interface LecturaOdometroReferencia {
  kilometraje: number;
  fechaReferencia: Date;
}

export interface LecturaOdometroRepository {
  save(lectura: LecturaOdometro): Promise<LecturaOdometro>;
  findLatestConfiableKm(activoId: number): Promise<number | null>;
  /** Última lectura confiable estrictamente anterior al momento del tanqueo (fecha + tanqueo OID). */
  findLatestConfiableKmAntesDelTanqueo(
    activoId: number,
    fechaTanqueo: Date,
    tanqueoId?: number | null
  ): Promise<number | null>;
  findLatestConfiableReferencias(
    activoIds: number[]
  ): Promise<Map<number, LecturaOdometroReferencia>>;
  findByTanqueoId(tanqueoId: number): Promise<LecturaOdometro | null>;
  findByActivoOrdered(activoId: number): Promise<LecturaOdometro[]>;
  findHistoryByActivo(
    activoId: number,
    page: number,
    limit: number
  ): Promise<[LecturaOdometroRead[], number]>;
}