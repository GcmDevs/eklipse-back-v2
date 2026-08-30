import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from './usuario.orm';
import { RolDependienteType } from '@inn/lgc/afn/types/gen/dependencias';

@Entity({ name: TABLE_NAMES.gen.dependencias, synchronize: false })
export class DependenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDPCODIGO' })
  codigo: string;

  @Column({ name: 'GDPNOMBRE' })
  nombre: string;

  @ManyToMany(() => UsuarioOrm, usuario => usuario.dependencias)
  usuarios: UsuarioOrm[];

  rol?: RolDependienteType;
}
