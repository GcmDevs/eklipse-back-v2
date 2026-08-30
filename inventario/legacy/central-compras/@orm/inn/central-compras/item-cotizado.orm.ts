import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SetOrm } from './set.orm';
import { ProveedorOrm } from '@inn/lgc/ctc/orm/gen';
import { ValorItemCotizadoOrm } from './valor-item-cotizado.orm';
import { ProductoOrm } from '../productos';

@Entity('EKINNCTCPFBITEM')
export class ItemCotizadoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => SetOrm)
  @JoinColumn([{ name: 'EKINNCTCPFBSET', referencedColumnName: 'id' }])
  set: SetOrm;

  @Column({ name: 'EKINNCTCPFBSET' })
  setId: number;

  @ManyToOne(() => ProductoOrm, producto => producto.ofertas)
  @JoinColumn({ name: 'INNPRODUC', referencedColumnName: 'id' })
  producto: ProductoOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: 'GENTERCERP', referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @Column({ name: 'GENTERCERP' })
  proveedorId: number;

  @ManyToOne(() => ValorItemCotizadoOrm)
  @JoinColumn([{ name: 'EKINNCTCPFBITEMVAL', referencedColumnName: 'id' }])
  valor: ValorItemCotizadoOrm;

  @Column({ name: 'EKINNCTCPFBITEMVAL' })
  valorId: number;

  @Column({ name: 'ISDELETED' })
  isDeleted: boolean;

  nombreProveedor?: string;
  valorMonetarioTemporal?: number;
}
