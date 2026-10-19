import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PagoOrm } from './pago.orm';
import { TipoPagoCode } from '@ctypes/inn/central-compras/cotizaciones';
import { DocumentoOrm } from '@orm/inn/documentos';

@Entity('EKINNCTCDOCUME')
export class DocumentoCotizacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKINNCTCOTIZ' })
  cotizacionId: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'INNDOCUME', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @Column({ name: 'INNDOCUME' })
  documentoId: number;

  @OneToMany(() => PagoOrm, pago => pago.cotDocumento)
  pagos: PagoOrm[];

  @Column({ name: 'ESTADO' })
  estadoId: number;

  @Column({ name: 'TIPOPAGO' })
  tipoPagoCode: TipoPagoCode;
}
