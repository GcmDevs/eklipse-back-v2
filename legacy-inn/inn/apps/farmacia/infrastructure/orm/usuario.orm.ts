import { RSAServices } from '@common/application/services';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('GENUSUARIO')
export class UsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUNOMBRE' })
  documento: string;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }
}
