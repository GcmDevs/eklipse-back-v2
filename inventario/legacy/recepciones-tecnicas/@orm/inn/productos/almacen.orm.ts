import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.pdt.almacenes)
export class AlmacenOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IALCODIGO' })
  codigo: string;

  @Column({ name: 'IALNOMBRE' })
  nombre: string;

  @Column({ name: 'IALPREFIJ' })
  prefijo: string;
}
