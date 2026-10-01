import {
  EstadoUsuarioCode,
  EstadoUsuarioType,
  estadoUsuarioTypeFactory,
} from '@gtypes/gen/usuarios';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DependenciaOrm } from './dependencia.orm';
import { RSAServices } from '@common/application/services';
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

  @ManyToOne(() => RolOrm, rol => rol.usuarios)
  @JoinColumn({ name: 'GENROL' })
  rol: RolOrm;

  @Column({ name: 'GENROL' })
  rolId: number;

  @ManyToMany(() => DependenciaOrm, dependencia => dependencia.usuarios)
  @JoinTable({
    name: 'EKGENUSUARIODEPEND',
    joinColumn: { name: 'GENUSUARIO', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'GENDEPEND', referencedColumnName: 'id' },
  })
  dependencias: DependenciaOrm[];

  estado?: EstadoUsuarioType;

  setTypes(removeTypeCodes?: boolean) {
    this.estado = estadoUsuarioTypeFactory(this.estadoCode);

    if (removeTypeCodes) {
      delete this.estadoCode;
    }
  }

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}
