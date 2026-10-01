import { RSAServices } from '@common/application/services';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { EstadoUsuarioCode } from '../../../@gtypes/gen/usuarios';
import { _PrivSecAuthOrm } from './authority.orm';
import { _PrivSecDependenceOrm } from './dependence.orm';
import { _PrivSecRoleOrm } from './role.orm';

@Entity('GENUSUARIO')
export class _PrivSecUserOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => _PrivSecRoleOrm, role => role.users)
  @JoinColumn({ name: 'GENROL' })
  role: _PrivSecRoleOrm;

  @Column({ name: 'USUDESCRI' })
  fullName: string;

  @Column({ name: 'USUNOMBRE' })
  document: string;

  @Column({ name: 'USUCLAVE' })
  password: string;

  @Column({ name: 'USUESTADO' })
  statusCode: EstadoUsuarioCode;

  @ManyToMany(() => _PrivSecAuthOrm, authority => authority.users)
  @JoinTable({
    name: 'GCMUSUPERMISO',
    joinColumn: { name: 'IDUSUARIO', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'IDMODULO', referencedColumnName: 'id' },
  })
  authorities: _PrivSecAuthOrm[];

  @ManyToMany(() => _PrivSecDependenceOrm, dependencia => dependencia.users)
  @JoinTable({
    name: 'EKGENUSUARIODEPEND',
    joinColumn: { name: 'GENUSUARIO', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'GENDEPEND', referencedColumnName: 'id' },
  })
  dependences: _PrivSecDependenceOrm[];

  public encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  public decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}
