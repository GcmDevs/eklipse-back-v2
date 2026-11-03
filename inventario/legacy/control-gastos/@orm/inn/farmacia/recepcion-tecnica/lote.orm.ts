import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DetalleRecepcionTecnicaOrm } from '@inn/lgc/cgt/orm/inn/farmacia/recepcion-tecnica/recepcion-tecnica.detalle.orm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.fmc.rct.lotes)
export class RTCLoteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => DetalleRecepcionTecnicaOrm, lote => lote.lotes)
  @JoinColumn({ name: 'GCMRECTECPROD' })
  RTCProducto: DetalleRecepcionTecnicaOrm;

  @Column({ name: 'GCMRECTECPROD' })
  RTCProductoId: number;

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 28, scale: 4 })
  cantidad: number;

  @Column({ name: 'LOTE' })
  lote: string;

  @Column({ name: 'VENCIMIENTO' })
  fechaVencimiento: Date;
}
