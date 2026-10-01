import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AgrupadorOrm } from './agrupador.orm';
import { CheckPointContratoOrm } from './check-point.orm';

@Entity('EKSLNAGRUCONT')
export class AgrupadorCheckPointContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKSLNAGRUPD' })
  agrupadorId: number;

  @ManyToOne(() => CheckPointContratoOrm, checkpoint => checkpoint.agrupadores)
  @JoinColumn({ name: 'EKSLNCHPTCONT' })
  checkPoint: CheckPointContratoOrm;

  @ManyToOne(() => AgrupadorOrm)
  @JoinColumn([{ name: 'EKSLNAGRUPD', referencedColumnName: 'id' }])
  agrupador: AgrupadorOrm;

  @Column({ name: 'LIMITE', type: 'money', scale: 4 })
  limite: number;

  @Column({ name: 'CANTEVENTOS', type: 'decimal', scale: 2 })
  cantidadEventosContratados: number;
}
