import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@orm/gen';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  MotivoAsignacionAsignacionTecnicoEmbedded,
  MotivoFinalizacionAsignacionTecnicoEmbedded,
} from '../supports';
import { RecursoOrm } from './recurso.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.pool_recursos.asignaciones_usuario_recurso })
@Index('IDX_EKINNEQPPLASINACIONRECURSOUSUARIO_RECURSO', ['recursoId'])
@Index('IDX_EKINNEQPPLASINACIONRECURSOUSUARIO_ACTIVA', ['recursoId', 'activa'])
export class AsignacionRecursoUsuarioOrm extends BaseTimestampedOrm {
  @ManyToOne(() => RecursoOrm, recur => recur.asignaciones, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'RECURSOID' })
  recurso: RecursoOrm;

  @Column({ name: 'RECURSOID' })
  recursoId: number;

  @ManyToOne(() => UsuarioOrm, { nullable: false })
  @JoinColumn({ name: 'USUARIOID' })
  usuario: UsuarioOrm;

  @Column({ name: 'USUARIOID' })
  usuarioId: number;

  @Column({ name: 'FECHINICIO', type: 'date', nullable: false })
  fechaInicio: Date;

  @Column({ name: 'FECHFIN', type: 'date', nullable: true })
  fechaFin: Date | null;

  @Column({ name: 'ACTIVA', type: 'bit', default: true })
  activa: boolean;

  @Column(() => MotivoAsignacionAsignacionTecnicoEmbedded, { prefix: false })
  motivoAsignacion: MotivoAsignacionAsignacionTecnicoEmbedded;

  @Column(() => MotivoFinalizacionAsignacionTecnicoEmbedded, { prefix: false })
  motivoFinalizacion: MotivoFinalizacionAsignacionTecnicoEmbedded;

  @Column({ name: 'ASIGNADOPOROID' })
  asignadoPorId: number;

  @Column({ name: 'FINALIZADOPOROID', nullable: true })
  finalizadoPorId: number | null;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 420, nullable: true })
  observaciones: string | null;
}
