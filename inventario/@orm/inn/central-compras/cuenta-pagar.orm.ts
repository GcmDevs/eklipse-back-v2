import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CotizacionOrm } from './cotizacion.orm';

@Entity('EKINNCTCCXP')
export class DetalleCuentaxPagarOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKINNCTCOTIZ' })
  cotizacionId: number;

  @ManyToOne(() => CotizacionOrm, cotizacion => cotizacion.cuentasxPagar)
  @JoinColumn({ name: 'EKINNCTCOTIZ' })
  cotizacion: CotizacionOrm;

  @Column({ name: 'PGNCXP' })
  cuentaxPagarId: number;

  @Column({ name: 'CTNCOM' })
  comprobanteContableId: number;

  @Column({ name: 'CTNCOMPLTO' })
  comprobanteContableAnio: string;

  @Column({ name: 'RETEFUENTE', type: 'decimal', precision: 7, scale: 2 })
  retefuente: number;

  @Column({ name: 'RETEICA', type: 'decimal', precision: 7, scale: 2 })
  reteica: number;

  @Column({ name: 'RETEIVA', type: 'decimal', precision: 7, scale: 2 })
  reteIVA: number;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;
}
