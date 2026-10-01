import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { CamaOrm } from './cama.orm';

@Entity('HPNTIPOCA')
export class TipoCamaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HTICODIGO' })
  codigo: string;

  @Column({ name: 'HTINOMBRE' })
  nombre: string;

  @OneToMany(() => CamaOrm, camas => camas.tipo)
  camas: CamaOrm[];

  get originalColumnName() {
    return 'HPNTIPOCA';
  }
}
