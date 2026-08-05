import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CotizacionPrefabricadaOrm } from './cotizacion-prefabricada.orm';
import { ProductoOrm } from '../productos';

@Entity('EKINNCTCPFBITEMSTORED')
export class CotizacionPrefabricadaItemOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKINNCTCPFB' })
  cotizacionId: number;

  @ManyToOne(() => CotizacionPrefabricadaOrm)
  @JoinColumn([{ name: 'EKINNCTCPFB', referencedColumnName: 'id' }])
  cotizacion: CotizacionPrefabricadaOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;
  @Column({ name: 'CANTIDAD', scale: 2 })
  cantidad: number;

  @Column({ name: 'VALORPAGADO', scale: 4 })
  valor: number;

  @Column({ name: 'IVA', scale: 2 })
  IVA: number;

  @ManyToOne(() => CotizacionPrefabricadaOrm, cotizacion => cotizacion.detalle)
  @JoinColumn({ name: 'EKINNCTCPFB', referencedColumnName: 'id' })
  cotizacionPrefabricada: CotizacionPrefabricadaOrm;
}
