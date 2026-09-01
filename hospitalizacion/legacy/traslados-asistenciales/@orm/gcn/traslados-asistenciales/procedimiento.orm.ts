import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { TrasladoTramoOrm } from './traslado-tramo.orm';
import { TrasladoAsignacionOrm } from './traslado-asignacion.orm';
import { ServicioIpsOrm } from '@hpn/lgc/tas/orm/gen';
import { ProcedimientoTempOrm } from './procedimiento-temp.orm';

@Entity({ name: 'EKHPNTRASLPROC' })
export class ProcedimientoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => TrasladoAsistencialOrm, traslado => traslado.procedimientos)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'TRAMO', nullable: true })
  tramoId?: number;

  @ManyToOne(() => TrasladoTramoOrm, tramo => tramo.procedimientos)
  @JoinColumn([{ name: 'TRAMO', referencedColumnName: 'id' }])
  tramo?: TrasladoTramoOrm;

  @Column({ name: 'ASIGNACION', nullable: true })
  asignacionId?: number;

  @ManyToOne(() => TrasladoAsignacionOrm)
  @JoinColumn([{ name: 'ASIGNACION', referencedColumnName: 'id' }])
  asignacion?: TrasladoAsignacionOrm;

  @Column({ name: 'PROCEDIMINTO', nullable: true })
  procedimientoId?: number;

  @ManyToOne(() => ServicioIpsOrm)
  @JoinColumn([{ name: 'PROCEDIMINTO', referencedColumnName: 'id' }])
  procedimiento?: ServicioIpsOrm;

  @Column({ name: 'EKPROCEDIMIENTO', nullable: true })
  ekprocedimientoId?: number;

  @OneToOne(() => ProcedimientoTempOrm)
  @JoinColumn([{ name: 'EKPROCEDIMIENTO', referencedColumnName: 'id' }])
  ekprocedimiento: ProcedimientoTempOrm;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'FECHAREGISTRO' })
  fechaRegistro: Date;

  @Column({ name: 'PROCESADAPORCENATE', nullable: true })
  centroProcesamiento: number;
}
