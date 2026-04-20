import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SubgrupoOrm } from './subgrupo.orm';

@Entity('HPNDEFCAM')
export class CamaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCACODIGO' })
  codigo: string;

  @Column({ name: 'HCANOMBRE' })
  nombre: string;

  @Column({ name: 'HPNSUBGRU' })
  subgrupoId: number;

  @ManyToOne(() => SubgrupoOrm)
  @JoinColumn([{ name: 'HPNSUBGRU', referencedColumnName: 'id' }])
  subgrupo: SubgrupoOrm;
}
