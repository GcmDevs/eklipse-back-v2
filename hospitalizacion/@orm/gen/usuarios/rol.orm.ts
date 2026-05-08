import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UsuarioOrm } from './usuario.orm';

@Entity('GENROL')
export class RolOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ROLNOMBRE' })
  nombre: string;

  @OneToMany(() => UsuarioOrm, usuario => usuario.rol)
  usuarios: UsuarioOrm[];
}
