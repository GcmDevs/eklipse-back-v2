import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { SolicitudTrasladoOrm } from './solicitud-traslado.orm';
import { TipoProfesionalCode } from '@hpn/gestion-clinica/v1/domain/types';
import { UsuarioOrm } from '../../../../orm/general';

@Entity({ name: 'GCMHPNSOLIOBSERVA' })
export class NotaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'observacion' })
  nota: string;

  @Column({ name: 'USUARIO' })
  usuarioId: number;

  @Column({ name: 'OBSPORCENTRO' })
  usuarioCentro: number;

  @Column({ name: 'TIPOPROFESIONAL' })
  tipoProfesional: TipoProfesionalCode;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'USUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'FECHA' })
  fecha: Date;

  @Column({ name: 'SOLITRANSLADO' })
  solicitudTrasladoId: number;

  @ManyToOne(() => SolicitudTrasladoOrm, soli => soli.observaciones)
  @JoinColumn([{ name: 'SOLITRANSLADO', referencedColumnName: 'id' }])
  solicitud: SolicitudTrasladoOrm;
}
