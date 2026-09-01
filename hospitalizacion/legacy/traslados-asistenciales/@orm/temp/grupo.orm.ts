import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CamaOrm } from './cama.orm';

@Entity('HPNGRUPOS')
export class GrupoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HGRCODIGO' })
  codigo: string;

  @Column({ name: 'HGRNOMBRE' })
  nombre: string;

  @OneToMany(() => CamaOrm, camas => camas.grupo)
  camas: CamaOrm[];
}
