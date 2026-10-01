import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { TerceroOrm } from './tercero.orm';

@Entity('GENPRESAL')
export class IpsOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PRECODIGO' })
  codigo: string;

  @Column({ name: 'PRENOMBRE' })
  nombre: string;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn([{ name: 'GENTERCER', referencedColumnName: 'id' }])
  tercero: TerceroOrm;

  @Column({ name: 'GENTERCER' })
  terceroId: number;

  get originalColumnName() {
    return 'GENPRESAL';
  }
}
