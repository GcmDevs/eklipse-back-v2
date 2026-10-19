import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RSAServices } from '@common/application/services';
import { LoteProductoOrm } from '../producto/lote.orm';
import { ProductoOrm } from '../producto/producto.orm';
import { ComprobanteEntradaOrm } from './comprobante-entrada.orm';
import { DetalleRemisionEntradaOrm } from './remision-entrada.detalle.orm';

@Entity('INNMCOMPR')
export class DetalleComprobanteEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ComprobanteEntradaOrm, comprobanteEntrada => comprobanteEntrada.detalle)
  @JoinColumn({ name: 'INNCCOMPR', referencedColumnName: 'id' })
  comprobanteEntrada: ComprobanteEntradaOrm;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @ManyToOne(() => DetalleRemisionEntradaOrm)
  @JoinColumn([{ name: 'INNMREMEN', referencedColumnName: 'id' }])
  itemRemision: DetalleRemisionEntradaOrm;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: 'INNLOTSER', referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: 'INNCCOMPR' })
  comprobanteEntradaId: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @Column({ name: 'INNMREMEN' })
  itemRemisionId: number;

  @Column({ name: 'INNLOTSER' })
  loteId: number;

  @Column({ name: 'IDDCANTID', precision: 2 })
  cantidad: number;

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}
