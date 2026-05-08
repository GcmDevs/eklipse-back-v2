import {
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinColumn,
  ManyToOne,
  JoinTable,
  Entity,
  Column,
} from 'typeorm';
import { EstadoUsuarioCode } from '@ctypes/gen/usuarios';
import { DependenciaOrm } from '../dependencia.orm';
import { RolOrm } from './rol.orm';

@Entity('GENUSUARIO')
export class UsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUNOMBRE' })
  cedula: string;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  @Column({ name: 'USUESTADO' })
  estadoCode: EstadoUsuarioCode;

  @Column({ name: 'GENROL' })
  rolId: number;

  @ManyToOne(() => RolOrm, rol => rol.usuarios)
  @JoinColumn({ name: 'GENROL' })
  rol: RolOrm;

  @ManyToMany(() => DependenciaOrm, dependencia => dependencia.usuarios)
  @JoinTable({
    name: 'EKGENUSUARIODEPEND',
    joinColumn: { name: 'GENUSUARIO', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'GENDEPEND', referencedColumnName: 'id' },
  })
  dependencias: DependenciaOrm[];
}
