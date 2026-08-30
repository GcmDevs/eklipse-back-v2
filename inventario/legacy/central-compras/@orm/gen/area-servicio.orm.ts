import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity({ name: TABLE_NAMES.gen.areasServicio, synchronize: false })
export class AreaServicioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GASCODIGO' })
  codigo: string;

  @Column({ name: 'GASNOMBRE' })
  nombre: string;
}
