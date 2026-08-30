import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { RemisionEntradaOrm } from './remision-entrada.orm';
import { LoteProductoOrm, ProductoOrm } from '../productos';
import { DetalleRecepcionTecnicaOrm } from '../farmacia/recepcion-tecnica';

@Entity(TABLE_NAMES.inn.dcm.rme.detalle)
export class DetalleRemisionEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RemisionEntradaOrm, remisionEntrada => remisionEntrada.detalle)
  @JoinColumn({ name: TABLE_NAMES.inn.dcm.rme.remisionesEntrada, referencedColumnName: 'id' })
  remisionEntrada: RemisionEntradaOrm;

  @Column({ name: TABLE_NAMES.inn.dcm.rme.remisionesEntrada })
  remisionEntradaId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.productos, referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.productos })
  productoId: number;

  @Column({ name: 'IDDCANTID', type: 'decimal', precision: 2 })
  cantidad: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.lotes, referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.lotes })
  loteId: number;

  @OneToOne(() => DetalleRecepcionTecnicaOrm, rctProducto => rctProducto.itemRemisionEntrada)
  rctProducto: DetalleRecepcionTecnicaOrm;

  comprobanteEntradaConsecutivo: string = null;
}
