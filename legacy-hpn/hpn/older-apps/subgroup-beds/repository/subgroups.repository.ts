import { Injectable } from '@nestjs/common';
import { IBaseRepository } from '../base';
import { SubgroupBeds } from '../entity';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class SubgroupsRepository extends BaseSource implements IBaseRepository {
  async getItems(center?: number): Promise<any[]> {
    try {
      if (center) {
        return await this.conn.query(
          `SELECT DISTINCT (A.OID), A.HSUCODIGO, A.HSUNOMBRE, B.ADNCENATE FROM HPNSUBGRU A 
        INNER JOIN HPNDEFCAM B ON A.OID = B.HPNSUBGRU WHERE B.ADNCENATE = @0`,
          [center]
        );
      } else {
        return await this.conn.query(
          `SELECT DISTINCT (A.OID), A.HSUCODIGO, A.HSUNOMBRE, B.ADNCENATE FROM HPNSUBGRU A 
        INNER JOIN HPNDEFCAM B ON A.OID = B.HPNSUBGRU`,
          []
        );
      }
    } catch (error) {
      return [];
    }
  }

  async getItem(id: number): Promise<SubgroupBeds> {
    try {
      const repo = this.conn.getRepository(SubgroupBeds);
      return await repo.findOne({ where: { id } });
    } catch (error) {
      return null;
    }
  }
}
