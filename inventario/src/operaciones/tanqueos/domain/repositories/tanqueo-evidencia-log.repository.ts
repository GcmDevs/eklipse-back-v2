import { TanqueoEvidenciaLog } from '../entities';

export interface TanqueoEvidenciaLogRepository {
  save(log: TanqueoEvidenciaLog): Promise<TanqueoEvidenciaLog>;
  findByTanqueoId(tanqueoId: number): Promise<TanqueoEvidenciaLog[]>;
}
