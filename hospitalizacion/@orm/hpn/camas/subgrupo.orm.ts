import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CamaOrm } from './cama.orm';

@Entity('HPNSUBGRU')
export class SubgrupoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HSUCODIGO' })
  codigo: string;

  @Column({ name: 'HSUNOMBRE' })
  nombre: string;

  @OneToMany(() => CamaOrm, camas => camas.subgrupo)
  camas: CamaOrm[];
}
