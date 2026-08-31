import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ProductoOrm } from '@inn/orm/inn/productos';
import { EstadoDespachoProductoCode, EstadoProductosCode } from '@inn/types/inn/solicitud-pedido';
import { SolicitudPedidoOrm } from './solicitud-pedido.orm';
import { UsuarioOrm } from '@inn/orm/gen';
import { SolicitudPedidoProductoDespachoOrm } from './solicitud-pedido-producto-despacho.orm';
import { SolicitudPedidoSobrepedidoOrm } from './solicitud-pedido-sobrepedido.orm';

@Entity('EKINNSOLPEPROD')
export class SolicitudPedidoProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SOLICITUDPEDIDOID' })
  solicitudPedidoId: number;

  @ManyToOne(() => SolicitudPedidoOrm, solicitudPedido => solicitudPedido.productos)
  @JoinColumn({ name: 'SOLICITUDPEDIDOID' })
  solicitudPedido: SolicitudPedidoOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn({ name: 'INNPRODUC', referencedColumnName: 'id' })
  producto: ProductoOrm;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoProductosCode;

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 10, scale: 4 })
  cantidad: number;

  @Column({ name: 'CANTIDADENVIADA', type: 'decimal', precision: 10, scale: 4, default: 0 })
  cantidadEnviada: number;

  @Column({ name: 'ESTADODESPACHO', default: 1 })
  estadoDespachoCode: EstadoDespachoProductoCode;

  @Column({
    name: 'CANTIDADRECHAZADA',
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
  })
  cantidadRechazada: number;

  @Column({
    name: 'CANTIDADSOBREPEDIDO',
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
  })
  cantidadSobrepedido: number;

  @Column({ name: 'OBSERVACIONRECHAZO', length: 1000, nullable: true })
  observacionRechazo?: string;

  @Column({ name: 'FECHARECHAZO', nullable: true })
  fechaRechazo?: Date;

  @Column({ name: 'GENUSRECHAZO', nullable: true })
  usuarioRechazoId?: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSRECHAZO', referencedColumnName: 'id' }])
  usuarioRechazo?: UsuarioOrm;

  @OneToMany(() => SolicitudPedidoProductoDespachoOrm, despacho => despacho.solicitudPedidoProducto)
  despachos: SolicitudPedidoProductoDespachoOrm[];

  @OneToMany(() => SolicitudPedidoSobrepedidoOrm, cierre => cierre.productoAnterior)
  cierresSobrepedido: SolicitudPedidoSobrepedidoOrm[];

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSDELETE', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'GENUSDELETE', nullable: true })
  usuarioId?: number;
}
