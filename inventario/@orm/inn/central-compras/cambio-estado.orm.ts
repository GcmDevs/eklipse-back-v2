import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EstadoCode, EstadoEspecificoCode } from '@inn/types/inn/central-compras/solicitudes';
import { SolicitudOrm } from './solicitud.orm';
import { UsuarioOrm } from '@inn/orm/gen';

@Entity('EKINNCTCESTA')
export class CambioEstadoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TIPOCBEST' })
  tipoCode: EstadoCode;

  @Column({ name: 'CUSTOMKEY' })
  keyCode: EstadoEspecificoCode;

  @Column({ name: 'INFORMADIO' })
  informacionAdicional: string;

  @Column({ name: 'EKINNCTCSOLI' })
  solicitudId: number;

  @ManyToOne(() => SolicitudOrm, solicitud => solicitud.cambiosEstado)
  @JoinColumn({ name: 'EKINNCTCSOLI' })
  solicitud: SolicitudOrm;

  @Column({ name: 'ENTIRELATIO' })
  entidadRelacionadaId: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'ARCHIJUNTO' })
  archivoRelacionado: string;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;
}
