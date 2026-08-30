import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SolicitudOrm } from './solicitud.orm';
import { DetalleCotizacionOrm } from './detalle-cotizacion.orm';
import { DetalleCuentaxPagarOrm } from './cuenta-pagar.orm';
import { PagoOrm } from './pago.orm';
import { DocumentoCotizacionOrm } from './documento.orm';
import { TipoPagoCode } from '@inn/lgc/ctc/types/inn/central-compras/cotizaciones';
import { ProveedorOrm } from '@inn/lgc/ctc/orm/gen';
import { DocumentoOrm } from '@inn/lgc/ctc/orm/inn/documentos';

@Entity('EKINNCTCOTIZ')
export class CotizacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKINNCTCSOLI' })
  solicitudId: number;

  @ManyToOne(() => SolicitudOrm, solicitud => solicitud.cotizaciones)
  @JoinColumn({ name: 'EKINNCTCSOLI' })
  solicitud: SolicitudOrm;

  @Column({ name: 'GENTERCERP' })
  proveedorId: number;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: 'GENTERCERP', referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @Column({ name: 'EKINNCTCDOCUME' })
  cotDocumentoId: number;

  @ManyToOne(() => DocumentoCotizacionOrm)
  @JoinColumn([{ name: 'EKINNCTCDOCUME', referencedColumnName: 'id' }])
  cotDocumento: DocumentoCotizacionOrm;

  @Column({ name: 'FECHPROGR' })
  fechaProgramacion: Date;

  @Column({ name: 'PAGADA' })
  pagada: boolean;

  @Column({ name: 'ENBODEGA' })
  listaParaEntrega: boolean;

  @Column({ name: 'CONTABILIZADA' })
  contabilizada: boolean;

  @Column({ name: 'ACTIVA' })
  isActiva: boolean;

  @Column({ name: 'REQUNICONTAB' })
  requiereUnicaContabilizacion: boolean;

  @Column({ name: 'RECIBIDA' })
  recibida: boolean;

  @OneToMany(() => DetalleCotizacionOrm, item => item.cotizacion)
  detalle: DetalleCotizacionOrm[];

  @OneToMany(() => DetalleCuentaxPagarOrm, item => item.cotizacion)
  cuentasxPagar: DetalleCuentaxPagarOrm[];

  documento: DocumentoOrm;
  documentoId: number;
  tipoPagoCode: TipoPagoCode;

  @OneToMany(() => PagoOrm, pago => pago.cotizacion)
  pagos: PagoOrm[];
}
