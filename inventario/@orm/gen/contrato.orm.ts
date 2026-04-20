import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TerceroOrm } from './tercero.orm';

@Entity('GENDETCON')
export class ContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDECODIGO' })
  codigo: string;

  @Column({ name: 'GDENOMBRE' })
  nombre: string;

  @Column({ name: `GENTERCER1` })
  terceroId: number;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn([{ name: `GENTERCER1`, referencedColumnName: 'id' }])
  tercero: TerceroOrm;
}
