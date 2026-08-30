import { TABLE_NAMES } from '@common/application/constants';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity(TABLE_NAMES.inn.pdt.lotes)
export class LoteProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ILSCODIGO' })
  codigo: string;

  @Column({ name: 'ILSFECVEN' })
  fechaVencimiento: Date;
}
