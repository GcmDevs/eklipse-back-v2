import { TABLE_NAMES } from '@common/application/constants';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity(TABLE_NAMES.gen.consecutivos)
export class ConsecutivoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GCOCODIGO' })
  codigo: string;

  @Column({ name: 'GCONOMBRE' })
  nombre: string;

  @Column({ name: 'GCONUMERO' })
  numero: number;
}
