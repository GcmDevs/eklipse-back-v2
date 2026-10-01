import { SyncLog } from '../entities';

export interface SyncLogRepository {
  save(syncLog: SyncLog): Promise<SyncLog>;
  findById(id: number): Promise<SyncLog | null>;
}
