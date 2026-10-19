import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RolOrm } from './rol.orm';

@Entity('GENUSUARIO')
export class UsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RolOrm, rol => rol.usuarios)
  @JoinColumn({ name: 'GENROL' })
  rol: RolOrm;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  @Column({ name: 'USUNOMBRE' })
  username: string;

  @Column({ name: 'USUCLAVE', select: false })
  password: string;

  @Column({ name: 'USUESTADO' })
  status: number;
}
