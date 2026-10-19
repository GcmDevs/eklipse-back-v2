import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InnGenUsuarioOrm } from './usuario.orm';

@Entity('GENROL')
export class InnRolOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ROLNOMBRE' })
  nombre: string;

  @OneToMany(() => InnGenUsuarioOrm, usuario => usuario.rol)
  usuarios: InnGenUsuarioOrm[];
}
