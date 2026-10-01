import { UserStatusCode } from '@sln/c-types/gen';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENUSUARIO')
export class UsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUNOMBRE' })
  cedula: string;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  @Column({ name: 'USUESTADO' })
  status: UserStatusCode;
}
