import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RecTecProductoOrm } from './producto.orm';

@Entity('GCMRECTECPRLOT')
export class RecTecLoteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RecTecProductoOrm, lote => lote.lotes)
  @JoinColumn({ name: 'GCMRECTECPROD' })
  recTecProducto: RecTecProductoOrm;

  @Column({ name: 'GCMRECTECPROD' })
  recTecProductoId: number;

  @Column({ name: 'CANTIDAD' })
  cantidad: number;

  @Column({ name: 'LOTE' })
  lote: string;

  @Column({ name: 'VENCIMIENTO' })
  fechaVencimiento: Date;
}
