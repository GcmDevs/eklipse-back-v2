import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ProductoOrm } from '../productos/producto.orm';
import { SetOrm } from './set.orm';

@Entity('EKINNCTCPFBSETINNPRODUC')
export class ProductoSetOrm {
  @JoinColumn({ name: 'INNPRODUC' })
  @PrimaryColumn({ name: 'INNPRODUC', type: 'int' })
  @ManyToOne(() => ProductoOrm, producto => producto.sets)
  producto: ProductoOrm;

  @JoinColumn({ name: 'EKINNCTCPFBSET' })
  @PrimaryColumn({ name: 'EKINNCTCPFBSET', type: 'int' })
  @ManyToOne(() => SetOrm, set => set.productos)
  set: SetOrm;

  @Column({ name: 'CANTSUGERI' })
  cantidad: number;
}
