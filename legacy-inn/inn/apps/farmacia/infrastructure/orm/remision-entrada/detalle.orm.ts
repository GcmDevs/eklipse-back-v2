import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { RemisionEntradaOrm } from './remision-entrada.orm';
import { RTCProductoOrm } from '../recepcion-tecnica/producto.orm';
import { ProductoOrm } from '@inn/orm/inn';
import { LoteProductoOrm } from '@inn/orm/inn/producto/lote.orm';

@Entity('INNMREMEN')
export class DetalleRemisionEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RemisionEntradaOrm, remisionEntrada => remisionEntrada.detalle)
  @JoinColumn({ name: 'INNCREMEN', referencedColumnName: 'id' })
  remisionEntrada: RemisionEntradaOrm;

  @Column({ name: 'INNCREMEN' })
  remisionEntradaId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @Column({ name: 'IDDCANTID', precision: 2 })
  cantidad: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: 'INNLOTSER', referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: 'INNLOTSER' })
  loteId: number;

  @OneToOne(() => RTCProductoOrm, rctProducto => rctProducto.itemRemisionEntrada)
  rctProducto: RTCProductoOrm;

  comprobanteEntradaConsecutivo: string = null;
}
