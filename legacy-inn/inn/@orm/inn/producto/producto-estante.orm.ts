import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { EstanteAlmacenOrm } from './estante.orm';
import { ProductoOrm } from './producto.orm';

@Entity('EKINNESTANTPRODUC')
export class ProductoEstanteOrm {
  @JoinColumn({ name: 'INNPRODUC' })
  @PrimaryColumn({ name: 'INNPRODUC', type: 'int' })
  @ManyToOne(() => ProductoOrm, producto => producto.estantes)
  producto: ProductoOrm;

  @Column({ name: 'INNPRODUC', type: 'int' })
  productoId: number;

  @JoinColumn({ name: 'EKINNESTANT' })
  @PrimaryColumn({ name: 'EKINNESTANT', type: 'int' })
  @ManyToOne(() => EstanteAlmacenOrm, estante => estante.productos)
  estante: EstanteAlmacenOrm;

  @Column({ name: 'EKINNESTANT', type: 'int' })
  estanteId: number;

  @Column({ name: 'STOCK' })
  stock: number;
}
