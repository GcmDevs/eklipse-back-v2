import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import {
  EstadoActividad,
  ModalidadEjecucionActividad,
  MotivoAnulacionActividad,
  NaturalezaIntervencionActividad,
  OrigenActividad,
  PrioridadActividad,
  TipoActividad,
} from '@equipos/domain/enums';
import { AnexoOrm } from '@orm/cor';
import { RegistroDiligenciadoFmtOrm } from 'apps/motor-formatos/infrastructure';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { EquipoOrm } from '../equipo.orm';
import { AsingacionRecursoActividadOrm } from '../pool-recursos/asignacion-actividad-recurso.orm';
import { EjecucionExternaOrm } from './ejecucion-externa.orm';
import { FormatoOrm } from './formato.orm';
import { PlanActividadOrm } from './plan-actividad.orm';
import { ReprogramacionActividadOrm } from './reprogramacion-actividad.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.actividades.regs_actividades })
export class RegistroActividadOrm extends BaseTimestampedOrm {
  @Column({ name: 'CODIGO', nullable: false })
  codigo: string;

  @ManyToOne(() => EquipoOrm, equipo => equipo.registrosMantenimientos)
  @JoinColumn({ name: 'EQUIPOOID' })
  equipo: EquipoOrm;

  @ManyToOne(() => PlanActividadOrm, actividad => actividad.registrosActividades, {
    nullable: true,
  })
  @JoinColumn({ name: 'PLANACTIVIDADOID' })
  planActividad: PlanActividadOrm;

  @OneToMany(() => AsingacionRecursoActividadOrm, a => a.actividad)
  asignacionesRecurso: AsingacionRecursoActividadOrm[];

  @ManyToOne(() => RegistroDiligenciadoFmtOrm, { nullable: true })
  @JoinColumn({ name: 'REGDILGOID' })
  registroDilg: RegistroDiligenciadoFmtOrm | null;

  @Column({ name: 'REGDILGOID', insert: false, update: false })
  registroDilgId: number | null;

  @OneToOne(() => EjecucionExternaOrm, e => e.registroActividad, { nullable: true })
  ejecucionExterna: EjecucionExternaOrm | null;

  @ManyToOne(() => FormatoOrm, { nullable: true })
  @JoinColumn({ name: 'FORMATOOID' })
  formato: FormatoOrm;

  @Column({ name: 'TIPO', type: 'nvarchar', length: 30, nullable: false })
  tipo: TipoActividad;

  @Column({ name: 'ORIGEN', type: 'nvarchar', length: 30, nullable: false })
  origen: OrigenActividad;

  @Column({ name: 'NATURALEZAEJECUCION', type: 'nvarchar', length: 10 })
  naturaleza: NaturalezaIntervencionActividad;

  @Column({ name: 'FECHPROGRAMADA', type: 'date', nullable: true })
  fechaProgramada: Date;

  @Column({ name: 'FECHREALIZACION', type: 'date', nullable: true })
  fechaRealizacion: Date;

  @Column({ name: 'DIASDESVIACION', type: 'int', nullable: true })
  diasDesviacion: number;

  @Column({ name: 'FECHINICIO', type: 'datetime2', nullable: true })
  fechaInicio: Date;

  @Column({ name: 'FECHFINALIZACION', type: 'datetime2', nullable: true })
  fechaFinalizacion: Date;

  @Column({ name: 'DURACIONMINUTOS', type: 'int', nullable: true })
  duracionMinutos: number;

  @Column({ name: 'ESTADO', type: 'nvarchar', length: 30, nullable: false })
  estado: EstadoActividad;

  @Column({ name: 'MOTIVOANULACION', type: 'nvarchar', length: 20 })
  motivoAnulacion: MotivoAnulacionActividad;

  @Column({ name: 'PRIORIDAD', type: 'nvarchar', length: 30, nullable: true })
  prioridad?: PrioridadActividad;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 'max', nullable: true })
  observaciones: string;

  @Column({ name: 'COSTOMANOOBRA', type: 'decimal', precision: 18, scale: 2, nullable: true })
  costoManoObra: number;

  @Column({ name: 'COSTOREPUESTOS', type: 'decimal', precision: 18, scale: 2, nullable: true })
  costoRepuestos: number;

  @Column({ name: 'COSTOTOTAL', type: 'decimal', precision: 18, scale: 2, nullable: true })
  costoTotal: number;

  @Column({ name: 'SOLICITADOPOROID', nullable: true })
  solicitadoPorId: number | null;

  @Column({ name: 'TECNICORESPONSABLEOID' })
  tecnicoResponsableId: number | null;

  @Column({ name: 'APROBADOPOROID', nullable: true })
  aprobadoPorId: number | null;

  @Column({ name: 'FECHPROBACION', type: 'datetime2', nullable: true })
  fechaAprobacion: Date | null;

  @Column({ name: 'MODPLANIFICADA', type: 'nvarchar', length: 20, nullable: true })
  modalidadPlanificada: ModalidadEjecucionActividad;

  @Column({ name: 'MODEJECUTADA', type: 'nvarchar', length: 20, nullable: true })
  modalidadEjecutada: ModalidadEjecucionActividad;

  @Column({ name: 'MOTIVORECHAZO', type: 'nvarchar', length: 400, nullable: true })
  motivoRechazo: string | null;

  anexos: AnexoOrm[];

  @OneToMany(
    () => ReprogramacionActividadOrm,
    reprogramaciones => reprogramaciones.registroActividad
  )
  reprogramaciones: ReprogramacionActividadOrm[];
}
