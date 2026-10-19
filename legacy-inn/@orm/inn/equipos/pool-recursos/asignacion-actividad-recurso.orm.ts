import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RegistroActividadOrm } from '../actividades';
import {
  MotivoAsignacionActividadEmbedded,
  MotivoFinalizacionActividadEmbedded,
} from '../supports';
import { RecursoOrm } from './recurso.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.pool_recursos.asignaciones_actividad_recurso })
@Index('IDX_EKINNEQPPLASINACIONRECURSOACTIVIDAD_ACTIVIDAD', ['actividadId'])
@Index('IDX_EKINNEQPPLASINACIONRECURSOACTIVIDAD_RECURSO', ['recursoId'])
@Index('IDX_EKINNEQPPLASINACIONRECURSOACTIVIDAD_ACTIVA', ['actividadId', 'activa'])
export class AsingacionRecursoActividadOrm extends BaseTimestampedOrm {
  @ManyToOne(() => RegistroActividadOrm, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ACTIVIDADOID' })
  actividad: RegistroActividadOrm;

  @Column({ name: 'ACTIVIDADOID' })
  actividadId: number;

  @ManyToOne(() => RecursoOrm, r => r.asignacionesActividades, { nullable: false })
  @JoinColumn({ name: 'RECURSOID' })
  recurso: RecursoOrm;

  @Column({ name: 'RECURSOID' })
  recursoId: number;

  @Column({ name: 'ACTIVA', type: 'bit', default: true })
  activa: boolean;

  @Column({ name: 'FECHASIGNACION', type: 'datetime2', nullable: false })
  fechaAsignacion: Date;

  @Column({ name: 'FECHFINALIZACION', type: 'datetime2', nullable: true })
  fechaFinalizacion: Date | null;

  @Column({ name: 'ASIGNADOPOROID', nullable: false })
  asignadoPorId: number;

  @Column({ name: 'FINALIZADOPOROID', nullable: true })
  finalizadoPorId: number | null;

  @Column(() => MotivoAsignacionActividadEmbedded, { prefix: false })
  motivoAsignacion: MotivoAsignacionActividadEmbedded;

  @Column(() => MotivoFinalizacionActividadEmbedded, { prefix: false })
  motivoFinalizacion: MotivoFinalizacionActividadEmbedded;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 420, nullable: true })
  observaciones: string | null;
}
