import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductoOrm } from '../../productos/producto.orm';
import { OrdenTrasladoOrm } from './base.orm';

@Entity('INNTRASPRODD')
export class DetalleOrdenTrasladoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'IDDCANTID', type: 'decimal', precision: 7, scale: 2 })
  cantidad: number;

  @Column({ name: 'INNTRASPROD' })
  ordenId: number;

  @ManyToOne(() => OrdenTrasladoOrm, orden => orden.detalle)
  @JoinColumn({ name: 'INNTRASPROD' })
  orden: OrdenTrasladoOrm;

  @Column({ name: 'ITPVALUNI', type: 'decimal', precision: 7, scale: 2 })
  valorUnitario: number;

  @Column({ name: 'INNNUMITE' })
  itemId: number;

  @Column({ name: 'OptimisticLockField' })
  optimisticLockField: number;
}
