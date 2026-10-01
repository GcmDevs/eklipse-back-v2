import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.pdt.agrupamientos)
export class AgrupamientoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AGRCODIGO' })
  codigo: string;

  @Column({ name: 'AGRNOMBRE' })
  nombre: string;
}
