import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { TrasladoTramoOrm } from './traslado-tramo.orm';
import { TrasladoAsignacionOrm } from './traslado-asignacion.orm';
import { UsuarioOrm } from '@hpn/lgc/tas/orm/gen';

@Entity('EKHPNTRASLSIGNOS')
export class TrasladoSignosVitalesOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @ManyToOne(() => TrasladoAsistencialOrm, traslado => traslado.signosVitales)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'TRAMO', nullable: true })
  tramoId?: number;

  @ManyToOne(() => TrasladoTramoOrm, tramo => tramo.signosVitales)
  @JoinColumn([{ name: 'TRAMO', referencedColumnName: 'id' }])
  tramo?: TrasladoTramoOrm;

  @Column({ name: 'ASIGNACION', nullable: true })
  asignacionId?: number;

  @ManyToOne(() => TrasladoAsignacionOrm)
  @JoinColumn([{ name: 'ASIGNACION', referencedColumnName: 'id' }])
  asignacion?: TrasladoAsignacionOrm;

  @Column({ name: 'MOMENTO' })
  momentoCode: number;

  @Column({ name: 'GENUSARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'FC', nullable: true })
  fc?: number;

  @Column({ name: 'FR', nullable: true })
  fr?: number;

  @Column({ name: 'TA', nullable: true })
  ta?: string;

  @Column({ name: 'SAT', nullable: true })
  sat?: number;

  @Column({ name: 'FCF', nullable: true })
  fcf?: number;

  @Column({ name: 'TEMP', nullable: true })
  temp?: number;

  @Column({ name: 'TALLA', nullable: true })
  talla?: number;

  @Column({ name: 'PESO', nullable: true })
  peso?: number;

  @Column({ name: 'GLASGOW', nullable: true })
  glasgow?: number;

  @Column({ name: 'OBSERVACION', nullable: true })
  observacion?: string;

  @Column({ name: 'FECHA', type: 'timestamp' })
  fecha: Date;

  @Column({ name: 'FECHAREGISTRO', type: 'timestamp' })
  fechaRegistro: Date;

  @Column({ name: 'PROCESADAPORCENATE', nullable: true })
  centroProcesamiento: number;
}
