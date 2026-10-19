import { TanqueoInconsistencia } from '../entities';
import { TanqueoInconsistenciaRead, TanqueoInconsistenciasGrupoRead } from '../reads';

export interface TanqueoInconsistenciaFilters {
  tanqueoId?: number;
  severidad?: string;
  contactoRealizado?: boolean;
}

export interface TanqueoInconsistenciaRepository {
  save(inconsistencia: TanqueoInconsistencia): Promise<TanqueoInconsistencia>;
  findById(id: number): Promise<TanqueoInconsistencia | null>;
  findViewById(id: number): Promise<TanqueoInconsistenciaRead | null>;
  findByTanqueoId(tanqueoId: number): Promise<TanqueoInconsistenciaRead[]>;
  findAllAndCount(
    page: number,
    limit: number,
    filters?: TanqueoInconsistenciaFilters
  ): Promise<[TanqueoInconsistenciaRead[], number]>;
  findAllGroupedAndCount(
    page: number,
    limit: number,
    filters?: TanqueoInconsistenciaFilters
  ): Promise<[TanqueoInconsistenciasGrupoRead[], number]>;
  saveMany(inconsistencias: TanqueoInconsistencia[]): Promise<void>;
}
