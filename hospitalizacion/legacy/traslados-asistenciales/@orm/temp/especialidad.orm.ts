import { IngresoOrm } from '@hpn/lgc/tas/orm/gen';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';

@Entity('GENESPECI')
export class EspecialidadOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GEECODIGO' })
  codigo: string;

  @Column({ name: 'GEEDESCRI' })
  descripcion: string;

  @OneToMany(() => IngresoOrm, ingreso => ingreso.especialidad)
  ingresos: IngresoOrm[];

  get originalColumnName() {
    return 'GENESPECI';
  }
}
