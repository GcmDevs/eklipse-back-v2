import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { UsuarioOrm } from '@hpn/lgc/tas/orm/gen';
import { MotivoFallidoTypeCode } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';

@Entity('EKHPNTRASLESTADOHIST')
export class TrasladoEstadoHistorialOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @Column({ name: 'TRAMO', nullable: true })
  tramoId?: number;

  @ManyToOne(() => TrasladoAsistencialOrm, traslado => traslado.estadosHistorial)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'ESTADO' })
  estadoCode: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'OBSERVACION', nullable: true })
  observacion?: string;

  @Column({ name: 'MOTIVO', nullable: true })
  motivoCancelacionCode: MotivoFallidoTypeCode;

  @Column({ name: 'FECHA', type: 'timestamp' })
  fecha: Date;

  @Column({ name: 'FECHAREGISTRO', type: 'timestamp' })
  fechaRegistro: Date;

  @Column({ name: 'PROCESADAPORCENATE', nullable: true })
  centroProcesamiento: number;
}
