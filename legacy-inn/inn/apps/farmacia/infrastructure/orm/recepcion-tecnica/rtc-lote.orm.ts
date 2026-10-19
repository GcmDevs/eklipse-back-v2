import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RTCProductoOrm } from './producto.orm';

@Entity('GCMRECTECPRLOT')
export class RTCLoteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RTCProductoOrm, lote => lote.lotes)
  @JoinColumn({ name: 'GCMRECTECPROD' })
  RTCProducto: RTCProductoOrm;

  @Column({ name: 'GCMRECTECPROD' })
  RTCProductoId: number;

  @Column({ name: 'CANTIDAD' })
  cantidad: number;

  @Column({ name: 'LOTE' })
  lote: string;

  @Column({ name: 'VENCIMIENTO' })
  fechaVencimiento: Date;
}
