import { SubgroupBeds } from '../entity';

export interface IBaseRepository {
  getItems(center?: number): Promise<any[]>;
  getItem(id: number): Promise<any>;
}
