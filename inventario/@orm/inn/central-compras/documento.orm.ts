import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TipoPagoCode } from '@inn/types/inn/central-compras/cotizaciones';
import { DocumentoOrm } from '../documentos';
import { PagoOrm } from './pago.orm';

@Entity('EKINNCTCDOCUME')
export class DocumentoCotizacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKINNCTCOTIZ' })
  cotizacionId: number;

  @Column({ name: 'INNDOCUME' })
  documentoId: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'INNDOCUME', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @OneToMany(() => PagoOrm, pago => pago.cotDocumento)
  pagos: PagoOrm[];

  @Column({ name: 'ESTADO' })
  estadoId: number;

  @Column({ name: 'TIPOPAGO' })
  tipoPagoCode: TipoPagoCode;
}
