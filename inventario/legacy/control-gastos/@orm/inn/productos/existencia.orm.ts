import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { AlmacenOrm } from '@inn/lgc/cgt/orm/inn/productos/almacen.orm';
import { ProductoOrm } from '@inn/lgc/cgt/orm/inn/productos/producto.orm';
import { LoteProductoOrm } from '@inn/lgc/cgt/orm/inn/productos/lote.orm';

@Entity(TABLE_NAMES.inn.pdt.existencias)
export class ExistenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => AlmacenOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.almacenes, referencedColumnName: 'id' }])
  almacen: AlmacenOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.almacenes })
  almacenId: number;

  @ManyToOne(() => ProductoOrm, producto => producto.existencias)
  @JoinColumn({ name: TABLE_NAMES.inn.pdt.productos })
  producto: ProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.productos })
  productoId: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.lotes, referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.lotes })
  loteId: number;

  @Column({ name: 'IFICANTID', scale: 2 })
  cantidad: number;
}
