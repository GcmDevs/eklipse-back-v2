import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity({ name: TABLE_NAMES.inn.afn.responsables, synchronize: false })
export class ResponsableOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'RESCODIGO' })
  codigo: string;

  @Column({ name: 'RESNOMBRE' })
  nombre: string;
}
