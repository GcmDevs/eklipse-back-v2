import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UsuarioOrm } from '@inn/orm/gen';
import { EstadoDespachoProductoCode } from '@inn/types/inn/solicitud-pedido';
import { SolicitudPedidoProductoOrm } from './solicitud-pedido-producto.orm';

@Entity('EKINNSOLPEPRODDESP')
export class SolicitudPedidoProductoDespachoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SOLPEPRODID' })
  solicitudPedidoProductoId: number;

  @ManyToOne(() => SolicitudPedidoProductoOrm, producto => producto.despachos)
  @JoinColumn({ name: 'SOLPEPRODID' })
  solicitudPedidoProducto: SolicitudPedidoProductoOrm;

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 10, scale: 4 })
  cantidad: number;

  @Column({ name: 'CANTIDADACUM', type: 'decimal', precision: 10, scale: 4 })
  cantidadAcumulada: number;

  @Column({ name: 'ESTADODESPACHO' })
  estadoDespachoCode: EstadoDespachoProductoCode;

  @Column({ name: 'OBSERVACION', length: 1000, nullable: true })
  observacion?: string;

  @Column({ name: 'FECHACREAC' })
  fechaCreacion: Date;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO', referencedColumnName: 'id' })
  usuario: UsuarioOrm;
}
