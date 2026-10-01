import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { RolDependenciaType } from '@gtypes/gen/dependencias';
import { _PrivSecUserOrm } from './user.orm';

@Entity({ name: 'GENDEPEND' })
export class _PrivSecDependenceOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDPCODIGO' })
  code: string;

  @Column({ name: 'GDPNOMBRE' })
  name: string;

  @ManyToMany(() => _PrivSecUserOrm, user => user.dependences)
  users: _PrivSecUserOrm[];

  role?: RolDependenciaType;
}
