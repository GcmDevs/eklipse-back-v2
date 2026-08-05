import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ValorItemCotizadoOrm } from './valor-item-cotizado.orm';
import { ProveedorOrm } from '@inn/orm/gen';
import { ProductoOrm } from '../productos';
import { SetOrm } from './set.orm';

@Entity('EKINNCTCPFBITEM')
export class ItemCotizadoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKINNCTCPFBSET' })
  setId: number;

  @ManyToOne(() => SetOrm)
  @JoinColumn([{ name: 'EKINNCTCPFBSET', referencedColumnName: 'id' }])
  set: SetOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm, producto => producto.ofertas)
  @JoinColumn({ name: 'INNPRODUC', referencedColumnName: 'id' })
  producto: ProductoOrm;

  @Column({ name: 'GENTERCERP' })
  proveedorId: number;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: 'GENTERCERP', referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @Column({ name: 'EKINNCTCPFBITEMVAL' })
  valorId: number;

  @ManyToOne(() => ValorItemCotizadoOrm)
  @JoinColumn([{ name: 'EKINNCTCPFBITEMVAL', referencedColumnName: 'id' }])
  valor: ValorItemCotizadoOrm;

  @Column({ name: 'ISDELETED' })
  isDeleted: boolean;
}
