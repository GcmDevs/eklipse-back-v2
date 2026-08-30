import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrdenCompraOrm } from './orden-compra.orm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.dcm.ocs.detalle)
export class DetalleOrdenCompraOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: TABLE_NAMES.inn.dcm.ocs.ordenesCompra })
  ordenId: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @Column({ name: 'IDDCANTID', type: 'decimal', precision: 7, scale: 2 })
  cantidad: number;

  @Column({ name: 'IMOVALUNP', type: 'decimal', precision: 7, scale: 2 })
  valorCOP: number;

  @Column({ name: 'IMOPORIVA', type: 'decimal', precision: 7, scale: 2 })
  porcIVA: number;

  @Column({ name: 'INNNUMITE' })
  itemId: number;

  @Column({ name: 'IMODETALLE' })
  detalle: string;

  @ManyToOne(() => OrdenCompraOrm, orden => orden.detalle)
  @JoinColumn({ name: TABLE_NAMES.inn.dcm.ocs.ordenesCompra })
  orden: OrdenCompraOrm;

  @Column({ name: 'IMOVALUNI', type: 'decimal', precision: 7, scale: 2 })
  valorUnidad: number;

  @Column({ name: 'IMOVALUNE', type: 'decimal', precision: 7, scale: 2 })
  valorEXT: number;

  @Column({ name: 'IMOPORDES', type: 'decimal', precision: 7, scale: 2 })
  porcDescuento: number;

  @Column({ name: 'IMOCANPEN', type: 'decimal', precision: 7, scale: 2 })
  cantidadPendiente: number;

  @Column({ name: 'IMOCANCAN', type: 'decimal', precision: 7, scale: 2 })
  cantidadCancelada: number;

  @Column({ name: 'IMOIMPORTADO' })
  isImportado: boolean;

  @Column({ name: 'OptimisticLockField' })
  optimisticLockField: number;
}
