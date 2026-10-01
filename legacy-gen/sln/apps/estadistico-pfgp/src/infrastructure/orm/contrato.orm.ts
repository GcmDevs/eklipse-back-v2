import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TerceroOrm } from './tercero.orm';

@Entity('GENCONTRA')
export class ContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GECCODIGO' })
  codigo: string;

  @Column({ name: 'GECNOMENT' })
  nombre: string;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn([{ name: 'GENTERCER1', referencedColumnName: 'id' }])
  tercero: TerceroOrm;

  @Column({ name: 'GENTERCER1' })
  terceroId: number;
}
