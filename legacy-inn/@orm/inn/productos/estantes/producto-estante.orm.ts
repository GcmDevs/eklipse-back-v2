import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { EstanteOrm } from './estante.orm';
import { ProductoOrm } from '../producto.orm';

@Entity(TABLE_NAMES.inn.pdt.stt.estanteProducto)
export class ProductoEstanteOrm {
  @JoinColumn({ name: TABLE_NAMES.inn.pdt.productos })
  @PrimaryColumn({ name: TABLE_NAMES.inn.pdt.productos, type: 'int' })
  @ManyToOne(() => ProductoOrm, producto => producto.estantes)
  producto: ProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.productos, type: 'int' })
  productoId: number;

  @JoinColumn({ name: TABLE_NAMES.inn.pdt.stt.estantes })
  @PrimaryColumn({ name: TABLE_NAMES.inn.pdt.stt.estantes, type: 'int' })
  @ManyToOne(() => EstanteOrm, estante => estante.productos)
  estante: EstanteOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.stt.estantes, type: 'int' })
  estanteId: number;

  @Column({ name: 'STOCK', scale: 4 })
  stock: number;

  @Column({ name: 'ISACTIVO', type: 'tinyint' })
  isActivo: boolean;
}
