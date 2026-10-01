import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RSAServices } from '@common/application/services';
import { LoteProductoOrm } from '../producto/lote.orm';
import { ProductoOrm } from '../producto/producto.orm';
import { RemisionEntradaOrm } from './remision-entrada.orm';

@Entity('INNMREMEN')
export class DetalleRemisionEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RemisionEntradaOrm, remisionEntrada => remisionEntrada.detalle)
  @JoinColumn({ name: 'INNCREMEN', referencedColumnName: 'id' })
  remisionEntrada: RemisionEntradaOrm;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'IDDCANTID', precision: 2 })
  cantidad: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: 'INNLOTSER', referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: 'INNCREMEN' })
  remisionEntradaId: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @Column({ name: 'INNLOTSER' })
  loteId: number;

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}
