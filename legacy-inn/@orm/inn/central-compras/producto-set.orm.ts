import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SetOrm } from './set.orm';
import { ProductoOrm } from '../productos';
import { TABLE_NAMES } from '@common/application/constants';

@Entity('EKINNCTCPFBSETINNPRODUC')
export class ProductoSetOrm {
  @JoinColumn({ name: TABLE_NAMES.inn.pdt.productos })
  @PrimaryColumn({ name: TABLE_NAMES.inn.pdt.productos, type: 'int' })
  @ManyToOne(() => ProductoOrm, producto => producto.sets)
  producto: ProductoOrm;

  @JoinColumn({ name: 'EKINNCTCPFBSET' })
  @PrimaryColumn({ name: 'EKINNCTCPFBSET', type: 'int' })
  @ManyToOne(() => SetOrm, set => set.productos)
  set: SetOrm;

  @Column({ name: 'CANTSUGERI' })
  cantidad: number;
}
