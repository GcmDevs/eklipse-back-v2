import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrdenCompraOrm } from './orden-compra';

@Entity('INNMORDEN')
export class DetalleOrdenCompraOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNNUMITE' })
  itemId: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @Column({ name: 'IMODETALLE' })
  detalle: string;

  @Column({ name: 'IDDCANTID', scale: 4 })
  cantidad: number;

  @Column({ name: 'INNCORDEN' })
  ordenId: number;

  @ManyToOne(() => OrdenCompraOrm, orden => orden.detalle)
  @JoinColumn({ name: 'INNCORDEN' })
  orden: OrdenCompraOrm;

  @Column({ name: 'IMOVALUNI', scale: 4 })
  valorUnidad: number;

  @Column({ name: 'IMOVALUNP', scale: 4 })
  valorCOP: number;

  @Column({ name: 'IMOVALUNE', scale: 4 })
  valorEXT: number;

  @Column({ name: 'IMOPORDES', scale: 4 })
  porcDescuento: number;

  @Column({ name: 'IMOPORIVA', scale: 4 })
  porcIVA: number;

  @Column({ name: 'IMOCANPEN', scale: 4 })
  cantidadPendiente: number;

  @Column({ name: 'IMOCANCAN', scale: 4 })
  cantidadCancelada: number;

  @Column({ name: 'IMOIMPORTADO' })
  isImportado: boolean;

  @Column({ name: 'OptimisticLockField' })
  optimisticLockField: number;
}
