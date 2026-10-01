import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OrdenDespachoOrm } from './orden-despacho.orm';
import { ProductoOrm } from '../producto.orm';

@Entity('INNORDDESD')
export class DetalleOrdenDespachoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNNUMITE' })
  item: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'IDDCANTID' })
  cantidad: number;

  @ManyToOne(() => OrdenDespachoOrm, ordenDespacho => ordenDespacho.items)
  @JoinColumn({ name: 'INNORDDESC' })
  ordenDespacho: OrdenDespachoOrm;

  @Column({ name: 'INNLOTSER' })
  loteSerialId: number;

  @Column({ name: 'IODCANPED' })
  cantidadSolicitada: number;

  @Column({ name: 'OptimisticLockField' })
  OptimisticLockField: number;

  @Column({ name: 'CPNSOLICID' })
  detalleSolicitudId: number;

  @Column({ name: 'IODCANDEV' })
  cantidadDevuelta: number;

  @Column({ name: 'IODCOSPRO' })
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

  @Column({ name: 'INNMCOMPR' })
  comprobanteId: number;

  @Column({ name: 'IODCANTENTR' })
  cantidadRecibida: number;

  @Column({ name: 'IODCANTCOMP' })
  cantidadComprometida: number;
}
