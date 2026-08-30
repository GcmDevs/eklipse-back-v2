import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { ActivoOrm } from './activo.orm';

@Entity(TABLE_NAMES.inn.afn.informacionGeneral)
export class InformacionAdicionalOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AGENUMSER' })
  numeroSerie: string;

  @OneToOne(() => ActivoOrm, activo => activo.informacionAdicional)
  @JoinColumn([{ name: TABLE_NAMES.inn.afn.activos, referencedColumnName: 'id' }])
  activo: ActivoOrm;

  @Column({ name: TABLE_NAMES.inn.afn.activos })
  activoId: number;
}
