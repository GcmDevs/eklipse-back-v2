import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENUSUARIO')
export class UsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  @Column({ name: 'USUNOMBRE' })
  username: string;

  @Column({ name: 'USUCLAVE', select: false })
  password: string;

  @Column({ name: 'USUESTADO' })
  status: number;
}
