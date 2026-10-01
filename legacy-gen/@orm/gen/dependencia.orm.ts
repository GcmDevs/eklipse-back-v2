import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { UsuarioOrm } from './usuario.orm';
import { RSAServices } from '@common/application/services';
import { RolDependienteType } from '@ctypes/gen';

@Entity('GENDEPEND')
export class DependenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDPCODIGO' })
  codigo: string;

  @Column({ name: 'GDPNOMBRE' })
  nombre: string;

  @ManyToMany(() => UsuarioOrm, usuario => usuario.dependencias)
  usuarios: UsuarioOrm[];

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }

  rol?: RolDependienteType;
}
