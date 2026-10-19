import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TipoEquipoOrm } from './tipo-equipo.orm';
import { FormatoOrm } from '../actividades/formato.orm';
import { PeriodoTiempoEmbeddable } from '../supports';

@Entity({ name: TABLE_NAMES.inn.eqp.tipo_eqp_planes_default })
export class PlanDefaultTipoEquipoOrm extends BaseTimestampedOrm {
  @ManyToOne(() => TipoEquipoOrm, tipo => tipo.planesDefault)
  @JoinColumn({ name: 'TIPOEQUIPOOID' })
  tipoEquipo: TipoEquipoOrm;

  @Column({ name: 'TIPO', type: 'nvarchar', length: 30 })
  tipo: string;

  @Column(() => PeriodoTiempoEmbeddable, { prefix: 'PERIOCIDAD' })
  periocidad?: PeriodoTiempoEmbeddable;

  @Column({ name: 'DIASANTNOTIF', type: 'int', nullable: true })
  diasAntNotif?: number;

  @Column({ name: 'REALIZAEXTERNO', type: 'bit', default: false })
  realizaExterno: boolean;

  @ManyToOne(() => FormatoOrm, { nullable: true })
  @JoinColumn({ name: 'FORMATOOID' })
  formato?: FormatoOrm;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 420, nullable: true })
  observaciones?: string;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;
}
