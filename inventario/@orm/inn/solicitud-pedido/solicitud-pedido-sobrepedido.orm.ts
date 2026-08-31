import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UsuarioOrm } from '@inn/orm/gen';
import { SolicitudPedidoOrm } from './solicitud-pedido.orm';
import { SolicitudPedidoProductoOrm } from './solicitud-pedido-producto.orm';

export type TipoCierreSobrepedido = 'REEMPLAZADO' | 'CERRADO_SIN_TRASLADO';

@Entity('EKINNSOLPESOBRE')
export class SolicitudPedidoSobrepedidoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SOLICITUDANTERIORID' })
  solicitudAnteriorId: number;

  @ManyToOne(() => SolicitudPedidoOrm, solicitud => solicitud.cierresSobrepedido)
  @JoinColumn({ name: 'SOLICITUDANTERIORID' })
  solicitudAnterior: SolicitudPedidoOrm;

  @Column({ name: 'PRODUCTOANTERIORID' })
  productoAnteriorId: number;

  @ManyToOne(() => SolicitudPedidoProductoOrm, producto => producto.cierresSobrepedido)
  @JoinColumn({ name: 'PRODUCTOANTERIORID' })
  productoAnterior: SolicitudPedidoProductoOrm;

  @Column({ name: 'SOLICITUDNUEVAID' })
  solicitudNuevaId: number;

  @ManyToOne(() => SolicitudPedidoOrm, solicitud => solicitud.origenesSobrepedido)
  @JoinColumn({ name: 'SOLICITUDNUEVAID' })
  solicitudNueva: SolicitudPedidoOrm;

  @Column({ name: 'PRODUCTONUEVOID', nullable: true })
  productoNuevoId?: number;

  @ManyToOne(() => SolicitudPedidoProductoOrm, { nullable: true })
  @JoinColumn({ name: 'PRODUCTONUEVOID' })
  productoNuevo?: SolicitudPedidoProductoOrm;

  @Column({ name: 'TIPOCIERRE', type: 'varchar', length: 24 })
  tipoCierre: TipoCierreSobrepedido;

  @Column({ name: 'CANTIDADCERRADA', type: 'decimal', precision: 10, scale: 4 })
  cantidadCerrada: number;

  @Column({ name: 'OBSERVACION', length: 1000 })
  observacion: string;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'USUARIOID' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'USUARIOID' })
  usuario: UsuarioOrm;
}
