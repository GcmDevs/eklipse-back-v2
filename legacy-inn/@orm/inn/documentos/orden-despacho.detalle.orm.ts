import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { OrdenDespachoOrm } from './orden-despacho.orm';
import { ProductoOrm } from '../productos/producto.orm';
import { LoteProductoOrm } from '../productos/lote.orm';

@Entity(TABLE_NAMES.inn.dcm.odp.detalle)
export class DetalleOrdenDespachoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.productos, referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.productos })
  productoId: number;

  @ManyToOne(() => OrdenDespachoOrm, ordenDespacho => ordenDespacho.detalle)
  @JoinColumn({ name: TABLE_NAMES.inn.dcm.odp.ordenesDespacho })
  ordenDespacho: OrdenDespachoOrm;

  @Column({ name: TABLE_NAMES.inn.dcm.odp.ordenesDespacho })
  ordenDespachoId: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.lotes, referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.lotes })
  loteId: number;

  @Column({ name: 'CPNSOLICID' })
  detalleSolicitudId: number;

  @Column({ name: 'IDDCANTID' })
  cantidad: number;

  @Column({ name: 'IODCANPED' })
  cantidadSolicitada: number;

  @Column({ name: 'IODCANDEV' })
  cantidadDevuelta: number;

  @Column({ name: 'IODCOSPRO', scale: 2 })
  precio: number;

  @Column({ name: 'IODDETALL' })
  detalle: string;

  @Column({ name: 'IODCANEJE' })
  cantidadEjecutada: number;

  @Column({ name: 'IODCANTACTU' })
  cantidadActual: number;

  @Column({ name: 'IODAGRCUBPED' })
  pedidoAgregado: boolean;

  @Column({ name: 'INNORDDESD' })
  detalleOrigen: number;

  @Column({ name: 'IODCANPEDSUMI' })
  cantidadSuministros: number;

  @Column({ name: 'IODCANTENTR' })
  cantidadRecibida: number;

  @Column({ name: 'IODCANTCOMP' })
  cantidadComprometida: number;

  @Column({ name: 'OptimisticLockField' })
  OptimisticLockField: number;
}
