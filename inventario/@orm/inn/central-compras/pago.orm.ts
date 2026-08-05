import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DocumentoCotizacionOrm } from './documento.orm';
import { CambioEstadoOrm } from './cambio-estado.orm';
import { CotizacionOrm } from './cotizacion.orm';

@Entity('EKINNCTCPAGO')
export class PagoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PORCENTAJE', type: 'decimal', precision: 7, scale: 2 })
  porcentaje: number;

  @Column({ name: 'VALOR', type: 'money', scale: 4 })
  valor: number;

  @Column({ name: 'VALORDESC', type: 'money', scale: 4 })
  valorDescuento: number;

  @Column({ name: 'ALFINATRAB' })
  pagarAlFinTrabajo: boolean;

  @Column({ name: 'EKINNCTCOTIZ' })
  cotizacionId: number;

  @ManyToOne(() => CotizacionOrm, cotizacion => cotizacion.pagos)
  @JoinColumn({ name: 'EKINNCTCOTIZ' })
  cotizacion: CotizacionOrm;

  @Column({ name: 'EKINNCTCDOCUME' })
  cotDocumentoId: number;

  @ManyToOne(() => DocumentoCotizacionOrm, cotDocumento => cotDocumento.pagos)
  @JoinColumn({ name: 'EKINNCTCDOCUME' })
  cotDocumento: DocumentoCotizacionOrm;

  @Column({ name: 'EKINNCTCCXP' })
  cuentaxPagarId: number;

  @Column({ name: 'PROXPAGO' })
  fechaOrdenCompra: Date;

  @Column({ name: 'DIASPLAZO' })
  diasPlazo: number;

  @Column({ name: 'FECHPROGRAM' })
  fechaProgramacion: Date;

  @Column({ name: 'EKINNCTCESTA1' })
  estadoAlProgramarId: number;

  @ManyToOne(() => CambioEstadoOrm)
  @JoinColumn([{ name: 'EKINNCTCESTA1', referencedColumnName: 'id' }])
  estadoAlProgramar: CambioEstadoOrm;

  @Column({ name: 'EKINNCTCESTA2' })
  estadoAlPagarId: number;

  @ManyToOne(() => CambioEstadoOrm)
  @JoinColumn([{ name: 'EKINNCTCESTA2', referencedColumnName: 'id' }])
  estadoAlPagar: CambioEstadoOrm;
}
