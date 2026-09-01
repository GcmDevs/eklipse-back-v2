import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MunicipioOrm } from './municipio.orm';

@Entity('GENDEPTO')
export class DepartamentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DEPCODDEP', length: 2 })
  codigo: string;

  @Column({ name: 'DEPNOMDEP', length: 80 })
  nombre: string;

  @OneToMany(() => MunicipioOrm, municipio => municipio.departamento)
  municipios: MunicipioOrm[];
}
