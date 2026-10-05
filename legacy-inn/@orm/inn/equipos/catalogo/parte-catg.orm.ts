import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.eqp.partes_catg })
@Unique('UQ_EKINNEQPHVPARTESCATG_PARTE', ['parte'])
export class ParteCatgOrm extends BaseOrm {
  @Column({ name: 'PARTE', type: 'varchar', length: 120 })
  parte: string;
}
