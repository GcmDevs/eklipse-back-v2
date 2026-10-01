import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { TerceroOrm } from '../tercero.orm';

@Entity(TABLE_NAMES.gen.ctt.contratos)
export class ContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GECCODIGO' })
  codigo: number;

  @Column({ name: 'GECNOMENT' })
  nombre: string;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn({ name: `${TABLE_NAMES.gen.terceros}1` })
  tercero: TerceroOrm;

  @Column({ name: `${TABLE_NAMES.gen.terceros}1` })
  terceroId: number;
}
