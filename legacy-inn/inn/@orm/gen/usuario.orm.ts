import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  EstadoUsuarioCode,
  EstadoUsuarioType,
  estadoUsuarioTypeFactory,
} from '@inn/ek-types/gen/usuario';
import { DependenciaOrm } from './dependencia.orm';
import { RolOrm } from './rol.orm';
import { TABLE_NAMES } from '@inn/orm/table-names';

@Entity(TABLE_NAMES.gen.usuarios)
export class UsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RolOrm, rol => rol.usuarios)
  @JoinColumn({ name: 'GENROL' })
  rol: RolOrm;

  @Column({ name: 'GENROL' })
  rolId: number;

  @Column({ name: 'USUNOMBRE' })
  cedula: string;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  @Column({ name: 'USUCLAVE', select: false })
  password: string;

  @Column({ name: 'USUESTADO' })
  estadoCode: EstadoUsuarioCode;

  @ManyToMany(() => DependenciaOrm, dependencia => dependencia.usuarios)
  @JoinTable({
    name: 'EKGENUSUARIODEPEND',
    joinColumn: {
      name: 'GENUSUARIO',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'GENDEPEND',
      referencedColumnName: 'id',
    },
  })
  dependencias: DependenciaOrm[];

  estado?: EstadoUsuarioType;

  setTypes(removeTypeCodes?: boolean) {
    this.estado = estadoUsuarioTypeFactory(this.estadoCode);

    if (removeTypeCodes) {
      delete this.estadoCode;
    }
  }
}
