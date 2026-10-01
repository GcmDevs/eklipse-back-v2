import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TerceroOrm } from './tercero.orm';

@Entity('GENCONTRA')
export class ContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GECCODIGO' })
  codigo: number;

  @Column({ name: 'GECNOMENT' })
  nombre: string;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn({ name: 'GENTERCER1' })
  tercero: TerceroOrm;

  @Column({ name: 'GENTERCER1' })
  terceroId: number;

  get originalColumnName() {
    return 'GENCONTRA';
  }
}
