import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { TerceroOrm } from './tercero.orm';

@Entity({ name: 'GEENENTADM' })
export class EntidadOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ENTNOMBRE' })
  nombre: string;

  @Column({ name: 'ENTCODIGO' })
  codigo?: string;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn([{ name: 'GENTERCER1', referencedColumnName: 'id' }])
  tercero: TerceroOrm;

  @Column({ name: 'GENTERCER1' })
  terceroId: number;
}
