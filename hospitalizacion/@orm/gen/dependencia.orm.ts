import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { UsuarioOrm } from './usuarios';

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
}
