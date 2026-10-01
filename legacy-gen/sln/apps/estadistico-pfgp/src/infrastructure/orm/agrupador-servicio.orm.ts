import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ServicioIpsOrm } from './servicio.orm';
import { AgrupadorOrm } from './agrupador.orm';

@Entity('EKSLNAGRUSERVTIP')
export class AgrupadorServicioIpsOrm {
  @JoinColumn({ name: 'GENSERIPS' })
  @PrimaryColumn({ name: 'GENSERIPS', type: 'int' })
  @ManyToOne(() => ServicioIpsOrm, servicio => servicio.agrupadores)
  servicio: ServicioIpsOrm;

  @JoinColumn({ name: 'EKSLNAGRUPD' })
  @PrimaryColumn({ name: 'EKSLNAGRUPD', type: 'int' })
  @ManyToOne(() => AgrupadorOrm, agrupador => agrupador.servicios)
  agrupador: AgrupadorOrm;

  @Column({ name: 'TIPO' })
  tipo: number;
}
