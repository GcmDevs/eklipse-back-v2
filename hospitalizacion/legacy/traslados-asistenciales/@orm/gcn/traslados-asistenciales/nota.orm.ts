import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { UsuarioOrm } from '@hpn/lgc/tas/orm/gen';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { TrasladoTramoOrm } from './traslado-tramo.orm';
import { TrasladoAsignacionOrm } from './traslado-asignacion.orm';

@Entity({ name: 'EKHPNTRASLNOTA' })
export class TrasladoNotaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @ManyToOne(() => TrasladoAsistencialOrm, traslado => traslado.notas)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'TRAMO', nullable: true })
  tramoId?: number;

  @ManyToOne(() => TrasladoTramoOrm, tramo => tramo.notas)
  @JoinColumn([{ name: 'TRAMO', referencedColumnName: 'id' }])
  tramo?: TrasladoTramoOrm;

  @Column({ name: 'ASIGNACION', nullable: true })
  asignacionId?: number;

  @ManyToOne(() => TrasladoAsignacionOrm)
  @JoinColumn([{ name: 'ASIGNACION', referencedColumnName: 'id' }])
  asignacion?: TrasladoAsignacionOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'NOTA' })
  nota: string;

  @Column({ name: 'FECHA' })
  fecha: Date;

  @Column({ name: 'FECHAREGISTRO' })
  fechaRegistro: Date;

  @Column({ name: 'PROCESADAPORCENATE', nullable: true })
  centroProcesamiento: number;
}

export { TrasladoNotaOrm as TAnotaOrm };
