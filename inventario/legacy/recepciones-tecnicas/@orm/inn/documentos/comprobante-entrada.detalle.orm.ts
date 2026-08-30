import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DetalleRemisionEntradaOrm } from './remision-entrada.detalle.orm';
import { ComprobanteEntradaOrm } from './comprobante-entrada.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { LoteProductoOrm, ProductoOrm } from '../productos';

@Entity(TABLE_NAMES.inn.dcm.cet.detalle)
export class DetalleComprobanteEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ComprobanteEntradaOrm, comprobanteEntrada => comprobanteEntrada.detalle)
  @JoinColumn({ name: TABLE_NAMES.inn.dcm.cet.comprobantesEntrada, referencedColumnName: 'id' })
  comprobanteEntrada: ComprobanteEntradaOrm;

  @Column({ name: TABLE_NAMES.inn.dcm.cet.comprobantesEntrada })
  comprobanteEntradaId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.productos, referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.productos })
  productoId: number;

  @ManyToOne(() => DetalleRemisionEntradaOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.dcm.rme.detalle, referencedColumnName: 'id' }])
  itemRemision: DetalleRemisionEntradaOrm;

  @Column({ name: TABLE_NAMES.inn.dcm.rme.detalle })
  itemRemisionId: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.lotes, referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.lotes })
  loteId: number;

  @Column({ name: 'IDDCANTID', type: 'decimal', precision: 2 })
  cantidad: number;
}
