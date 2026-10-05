import { EjecucionMantItemOrm } from 'apps/motor-formatos/infrastructure';
import { EjecucionMantItemRead } from '../read';

export interface EjecucionMantItemRepository {
  save(ejecucionMantItem: Partial<EjecucionMantItemOrm>): Promise<EjecucionMantItemRead>;
  findByIds(ids: number[]): Promise<EjecucionMantItemOrm[]>;
  findAll(): Promise<EjecucionMantItemRead[]>;
}
