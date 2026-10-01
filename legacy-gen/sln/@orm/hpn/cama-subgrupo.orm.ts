import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { CamaOrm } from './cama.orm';

@Entity('HPNSUBGRU')
export class SubgrupoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HSUCODIGO' })
  codigo: string;

  @Column({ name: 'HSUNOMBRE' })
  nombre: string;

  @Column({ name: 'GENARESER' })
  areaServicioId: number;

  @OneToMany(() => CamaOrm, camas => camas.subgrupo)
  camas: CamaOrm[];
}
