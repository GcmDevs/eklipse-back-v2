import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { UsuarioOrm } from '@hpn/lgc/tas/orm/gen';
import { MotivoFallidoTypeCode } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';

@Entity('EKHPNTRASLREVISIONCENTRAL')
export class TrasladoRevisionCentralOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @ManyToOne(() => TrasladoAsistencialOrm, traslado => traslado.revisionesCentral)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'USUARIOCENTRAL' })
  usuarioCentralId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'USUARIOCENTRAL', referencedColumnName: 'id' }])
  usuarioCentral: UsuarioOrm;

  @Column({ name: 'RESULTADO' })
  resultadoCode: number;

  @Column({ name: 'MOTIVO', nullable: true })
  motivo: MotivoFallidoTypeCode;

  @Column({ name: 'OBSERVACION', nullable: true })
  observacion?: string;

  @Column({ name: 'FECHA', type: 'timestamp' })
  fecha: Date;

  @Column({ name: 'PROCESADAPORCENATE', nullable: true })
  centroProcesamiento: number;
}
