import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNMORDACTNET')
export class DetalleOrdenActivoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNCORDEN' })
  ordenId: number;

  @Column({ name: 'AFNPRODUC' })
  productoId: number;

  @Column({ name: 'IDDCANTID', type: 'decimal', precision: 7, scale: 2 })
  cantidad: number;

  @Column({ name: 'IMOVALUNP', type: 'decimal', precision: 7, scale: 2 })
  valorCOP: number;

  @Column({ name: 'IMOPORIVA', type: 'money', scale: 4 })
  porcIVA: number;

  @Column({ name: 'IMOVALUNE', type: 'decimal', precision: 7, scale: 2 })
  valorEXT: number;

  @Column({ name: 'IMOPORDES', type: 'decimal', precision: 7, scale: 2 })
  porcDescuento: number;

  @Column({ name: 'IMOCANPEN', type: 'decimal', precision: 7, scale: 2 })
  cantidadPendiente: number;

  @Column({ name: 'IMOCANCAN', type: 'decimal', precision: 7, scale: 2 })
  cantidadCancelada: number;
}
