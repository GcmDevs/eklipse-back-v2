import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RolOrm } from './rol.orm';
import { UserStatusCode } from '@hpn/lgc/tas/types/gen';
import { GcmContextType } from '@common/domain/types';

@Entity('GENUSUARIO')
export class UsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RolOrm, rol => rol.usuarios)
  @JoinColumn({ name: 'GENROL' })
  rol: RolOrm;

  @Column({ name: 'USUNOMBRE' })
  cedula: string;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  @Column({ name: 'USUCLAVE', select: false })
  password: string;

  @Column({ name: 'USUESTADO' })
  status: UserStatusCode;

  username?: string;

  contexto: GcmContextType;
}
