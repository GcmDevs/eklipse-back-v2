import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import {
  EstadoPlanActividad,
  OrigenInicializacionPlan,
  TipoActividad,
} from '@equipos/domain/enums';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { EquipoOrm } from '../equipo.orm';
import { PeriodoTiempoEmbeddable } from '../supports';
import { FormatoOrm } from './formato.orm';
import { RegistroActividadOrm } from './registro-actividad.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.actividades.planes_actividades })
@Unique('UQ_EKINNEQPACTPLANESACTIVIDAD_EQUIPO_TIPO', ['equipo', 'tipo'])
export class PlanActividadOrm extends BaseOrm {
  @ManyToOne(() => EquipoOrm, equipo => equipo.planesActividad, { nullable: false })
  @JoinColumn({ name: 'EQUIPOOID' })
  equipo: EquipoOrm;

  @Column({ name: 'TIPO', type: 'nvarchar', length: 30, nullable: false })
  tipo: TipoActividad;

  @ManyToOne(() => FormatoOrm, { onDelete: 'NO ACTION', nullable: true })
  @JoinColumn({ name: 'FORMATOOID' })
  formato?: FormatoOrm;

  @Column({ name: 'REALIZAEXTERNO', type: 'bit', default: false })
  seRealizaPorExterno?: boolean;

  @Column({ name: 'ESTADO', type: 'nvarchar', length: 30, nullable: false })
  estado: EstadoPlanActividad;

  @Column(() => PeriodoTiempoEmbeddable, { prefix: 'PERIOCIDAD' })
  periocidad?: PeriodoTiempoEmbeddable;

  @Column({ name: 'ORIGENINICIALIZACION', type: 'nvarchar' })
  origenInicializacion: OrigenInicializacionPlan;

  @Column({ name: 'FECHAINICIALIZACION', type: 'date' })
  fechaInicializacion: Date;

  @Column({ name: 'FECHULTEJEC', type: 'date', nullable: true })
  fechaUltimaEjecucion: Date;

  @Column({ name: 'FECHPROXEJEC', type: 'date', nullable: true })
  fechaProximaEjecucion: Date;

  @Column({ name: 'DIASANTNOTIF', type: 'int', nullable: true })
  diasAnticipacionNotificacion: number;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 420, nullable: true })
  observaciones?: string;

  @OneToMany(() => RegistroActividadOrm, regsActividad => regsActividad.planActividad)
  registrosActividades: RegistroActividadOrm[];
}
