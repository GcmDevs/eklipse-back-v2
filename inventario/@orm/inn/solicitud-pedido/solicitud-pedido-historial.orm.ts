import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { SolicitudPedidoOrm } from './solicitud-pedido.orm';
import { UsuarioOrm } from '@inn/orm/gen';
import { CentroOrm } from '@inn/orm/adn';
import { EstadoSolicitudPedidoCode } from '@inn/types/inn/solicitud-pedido';

@Entity('EKINNSOLPEHIST')
export class SolicitudPedidoHistorialOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => SolicitudPedidoOrm, sp => sp.historial)
  @JoinColumn({ name: 'SOLICITUDPEDIDOID' })
  solicitudPedido: SolicitudPedidoOrm;

  @Column({ name: 'SOLICITUDPEDIDOID' })
  solicitudPedidoId: number;

  @Column({ name: 'SEDE' })
  sedeId: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn({ name: 'SEDE', referencedColumnName: 'id' })
  sede: CentroOrm;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoSolicitudPedidoCode;

  @Column({ name: 'FECHACAMBIO' })
  fechaCambio: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'USUARIOID' })
  usuario: UsuarioOrm;

  @Column({ name: 'USUARIOID' })
  usuarioId: number;

  @Column({ name: 'OBSERVACION', nullable: true })
  observacion?: string;

  @Column({ name: 'FACTURALINK', nullable: true })
  facturaLink?: string;
}
