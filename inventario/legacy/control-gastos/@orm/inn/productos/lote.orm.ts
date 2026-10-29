import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.pdt.lotes)
export class LoteProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ILSCODIGO' })
  codigo: string;

  @Column({ name: 'ILSFECVEN' })
  fechaVencimiento: Date;
}
