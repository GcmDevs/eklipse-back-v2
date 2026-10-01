import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AgrupadorCheckPointContratoOrm } from './check-point-agrupador.orm';
import { DetalleContratoOrm } from './contrato-detalle.orm';

@Entity('EKSLNCHPTCONT')
export class CheckPointContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENDETCON' })
  contratoId: number;

  @ManyToOne(() => DetalleContratoOrm)
  @JoinColumn([{ name: 'GENDETCON', referencedColumnName: 'id' }])
  contrato: DetalleContratoOrm;

  @Column({ name: 'VALCONTRA', type: 'money', scale: 4 })
  valor: number;

  @Column({ name: 'FECHINI' })
  fechaInicio: Date;

  @Column({ name: 'FECHFIN' })
  fechaFin: Date;

  @Column({ name: 'KEYAGRUSERVTIP' })
  keyAgrupadorServicio: number;

  @OneToMany(() => AgrupadorCheckPointContratoOrm, agrupador => agrupador.checkPoint)
  agrupadores: AgrupadorCheckPointContratoOrm[];

  codigoContrato: string;
  nombreContrato: string;
}
