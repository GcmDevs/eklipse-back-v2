import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { SolicitudTrasladoOrm } from './solicitud-traslado.orm';
import { UsuarioOrm } from '@orm/gen';
import { TipoProfesionalCode } from '@ctypes/gcn';

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
