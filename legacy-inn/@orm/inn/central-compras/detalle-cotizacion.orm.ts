import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CotizacionOrm } from './cotizacion.orm';
import { DetalleSolicitudOrm } from './detalle-solicitud.orm';
import { SolicitudOrm } from './solicitud.orm';

@Entity('EKINNCTCOTIZITEM')
export class DetalleCotizacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => SolicitudOrm, solicitud => solicitud.cotizaciones)
  @JoinColumn({ name: 'EKINNCTCSOLI' })
  solicitud: SolicitudOrm;

  @Column({ name: 'EKINNCTCSOLI' })
  solicitudId: number;

  @ManyToOne(() => CotizacionOrm, cotizacion => cotizacion.detalle)
  @JoinColumn({ name: 'EKINNCTCOTIZ' })
  cotizacion: CotizacionOrm;

  @Column({ name: 'EKINNCTCOTIZ' })
  cotizacionId: number;

  @ManyToOne(() => DetalleSolicitudOrm)
  @JoinColumn([{ name: 'EKINNCTCSOLITEM', referencedColumnName: 'id' }])
  item: DetalleSolicitudOrm;

  @Column({ name: 'EKINNCTCSOLITEM' })
  itemId: number;

  @Column({ name: 'VALORUNITARIO', type: 'money', scale: 4 })
  valorUnitario: number;

  @Column({ name: 'IVA', type: 'money', scale: 4 })
  IVA: number;

  @Column({ name: 'DESCUENTO', type: 'money', scale: 4 })
  descuento: number;

  @Column({ name: 'ISAPROBADO' })
  isAprobado: boolean;
}
