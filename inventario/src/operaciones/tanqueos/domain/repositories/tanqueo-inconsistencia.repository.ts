import { TanqueoInconsistencia } from '../entities';
import { TanqueoInconsistenciaRead } from '../reads';

export interface TanqueoInconsistenciaRepository {
  save(inconsistencia: TanqueoInconsistencia): Promise<TanqueoInconsistencia>;
  findById(id: number): Promise<TanqueoInconsistencia | null>;
  findViewById(id: number): Promise<TanqueoInconsistenciaRead | null>;
  findByTanqueoId(tanqueoId: number): Promise<TanqueoInconsistenciaRead[]>;
  findAbiertasByTanqueoId(tanqueoId: number): Promise<TanqueoInconsistencia[]>;
  tieneCriticasAbiertas(tanqueoId: number): Promise<boolean>;
  saveMany(inconsistencias: TanqueoInconsistencia[]): Promise<void>;
}
