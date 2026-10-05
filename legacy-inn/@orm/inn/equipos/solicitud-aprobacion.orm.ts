import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { formatTiempoResolucion } from '@equipos/application/helpers';
import { EstadoSolicitud, TipoAccionAprobacion } from '@equipos/domain/enums';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EquipoOrm } from './equipo.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.solicitudes })
@Index('UQ_EKINNEQPSOLICITUDESAPROBACION_CODIGO', ['codigo'], { unique: true })
export class SolicitudAprobacionOrm extends BaseTimestampedOrm {
  @Column({ name: 'CODIGO', type: 'nvarchar' })
  codigo: string;

  @ManyToOne(() => EquipoOrm, { nullable: false })
  @JoinColumn({ name: 'EQUIPOID' })
  equipo: EquipoOrm;

  @Column({ name: 'EQUIPOID', type: 'int', update: false })
  equipoId: number;

  @Column({ name: 'TIPOACCION', type: 'varchar' })
  tipoAccion: TipoAccionAprobacion;

  @Column({ name: 'ESTADO', type: 'varchar', default: EstadoSolicitud.PENDIENTE })
  estado: EstadoSolicitud;

  @Column({ name: 'SOLICITANTEID', type: 'int' })
  solicitanteId: number;

  @Column({ name: 'SOLICITANTENOMBRE', type: 'varchar' })
  solicitanteNombre: string;

  @Column({ name: 'APROBADORID', type: 'int', nullable: true })
  aprobadorId?: number;

  @Column({ name: 'APROBADORNOMBRE', type: 'varchar', nullable: true })
  aprobadorNombre?: string;

  @Column({ name: 'FECHARESOLUCION', type: 'datetime2', nullable: true })
  fechaResolucion?: Date;

  @Column({ name: 'PAYLOAD', type: 'nvarchar', length: 'max' })
  payload: string;

  @Column({ name: 'MOTIVORECHAZO', type: 'nvarchar', length: 400, nullable: true })
  motivoRechazo?: string;

  @Column({ name: 'ESAUTOAPROBADA', type: 'bit', default: false })
  esAutoAprobada: boolean;

  @Column({ name: 'CORRELATIONOID', type: 'varchar', length: 21 })
  correlationId: string | null;

  get tiempoResolucionMin(): string | null {
    return this.esAutoAprobada
      ? null
      : formatTiempoResolucion(this.createdAt, this.fechaResolucion);
  }
}
