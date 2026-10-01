import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.pdt.grupos)
export class GrupoProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IGRCODIGO' })
  codigo: string;

  @Column({ name: 'IGRNOMBRE' })
  nombre: string;
}
