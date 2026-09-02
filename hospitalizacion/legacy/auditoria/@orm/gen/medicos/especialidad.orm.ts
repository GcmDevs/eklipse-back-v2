import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.gen.medicos.especialidad)
export class EspecialidadOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GEECODIGO' })
  codigo: string;

  @Column({ name: 'GEEDESCRI' })
  nombre: string;
}
