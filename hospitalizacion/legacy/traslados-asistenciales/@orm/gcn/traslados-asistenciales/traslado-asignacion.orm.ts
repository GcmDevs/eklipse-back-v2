import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { TrasladoTramoOrm } from './traslado-tramo.orm';
import { VehiculoOrm } from '../vehiculo.orm';
import { EkEmpleadoOrm } from '../ek-empleado.orm';
import { UsuarioOrm } from '@hpn/lgc/tas/orm/gen';
import { TABLE_NAMES } from '@common/application/constants';
import { GcmContextType } from '@common/domain/types';

@Entity(TABLE_NAMES.hpn.trasladosAsistenciales.asignacion)
export class TrasladoAsignacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @ManyToOne(() => TrasladoAsistencialOrm, traslado => traslado.asignaciones)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'TRAMO', nullable: true })
  tramoId?: number;

  @ManyToOne(() => TrasladoTramoOrm, tramo => tramo.asignaciones)
  @JoinColumn([{ name: 'TRAMO', referencedColumnName: 'id' }])
  tramo?: TrasladoTramoOrm;

  @Column({ name: 'VEHICULO' })
  vehiculoId: number;

  @ManyToOne(() => VehiculoOrm)
  @JoinColumn([{ name: 'VEHICULO', referencedColumnName: 'id' }])
  vehiculo: VehiculoOrm;

  @Column({ name: 'CONDUCTOR' })
  conductorId: number;

  @ManyToOne(() => EkEmpleadoOrm)
  @JoinColumn([{ name: 'CONDUCTOR', referencedColumnName: 'id' }])
  conductor?: EkEmpleadoOrm;

  @Column({ name: 'AUXILIAR' })
  auxiliarId: number;

  @ManyToOne(() => EkEmpleadoOrm)
  @JoinColumn([{ name: 'AUXILIAR', referencedColumnName: 'id' }])
  auxiliar: EkEmpleadoOrm;

  @Column({ name: 'MEDICO', nullable: true })
  medicoId?: number;

  @ManyToOne(() => EkEmpleadoOrm)
  @JoinColumn([{ name: 'MEDICO', referencedColumnName: 'id' }])
  medico: EkEmpleadoOrm;

  @Column({ name: 'ASIGNADOPOR' })
  asignadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'ASIGNADOPOR', referencedColumnName: 'id' }])
  asignadoPor: UsuarioOrm;

  @Column({ name: 'ESTADO', nullable: true })
  estadoCode?: number;

  @Column({ name: 'MOTIVO', nullable: true })
  motivo?: string;

  @Column({ name: 'FECHAASIGNACION', type: 'timestamp' })
  fechaAsignacion: Date;

  @Column({ name: 'FECHADESASIGNACION', type: 'timestamp', nullable: true })
  fechaDesasignacion?: Date;

  @Column({ name: 'ISACTIVA', nullable: true })
  isActiva?: boolean;

  @Column({ name: 'PROCESADAPORCENATE', nullable: true })
  centroProcesamiento: number;

  contexto: GcmContextType;
}
