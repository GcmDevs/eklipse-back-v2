import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.afn.grupos)
export class GrupoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GRUCODIGO' })
  codigo: string;

  @Column({ name: 'GRUNOMBRE' })
  nombre: string;
}
