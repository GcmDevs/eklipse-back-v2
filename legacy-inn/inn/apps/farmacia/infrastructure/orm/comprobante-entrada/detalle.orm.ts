import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ComprobanteEntradaOrm } from './comprobante-entrada.orm';
import { DetalleRemisionEntradaOrm } from '../remision-entrada/detalle.orm';
import { LoteProductoOrm, ProductoOrm } from '@inn/orm/inn';

@Entity('INNMCOMPR')
export class DetalleComprobanteEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ComprobanteEntradaOrm, comprobanteEntrada => comprobanteEntrada.detalle)
  @JoinColumn({ name: 'INNCCOMPR', referencedColumnName: 'id' })
  comprobanteEntrada: ComprobanteEntradaOrm;

  @Column({ name: 'INNCCOMPR' })
  comprobanteEntradaId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => DetalleRemisionEntradaOrm)
  @JoinColumn([{ name: 'INNMREMEN', referencedColumnName: 'id' }])
  itemRemision: DetalleRemisionEntradaOrm;

  @Column({ name: 'INNMREMEN' })
  itemRemisionId: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: 'INNLOTSER', referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: 'INNLOTSER' })
  loteId: number;

  @Column({ name: 'IDDCANTID', precision: 2 })
  cantidad: number;
}
