import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { TerceroOrm } from './tercero.orm';

@Entity(TABLE_NAMES.gen.ctt.detalle)
export class ContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDECODIGO' })
  codigo: string;

  @Column({ name: 'GDENOMBRE' })
  nombre: string;

  /* SE AGREGO EL TERCERO  */
  @Column({ name: `${TABLE_NAMES.gen.terceros}1` })
  terceroId: number;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.terceros}1`, referencedColumnName: 'id' }])
  tercero: TerceroOrm;
}
