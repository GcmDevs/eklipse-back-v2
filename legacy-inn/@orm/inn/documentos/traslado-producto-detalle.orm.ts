import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentoOrm } from './documento.orm';
import { TrasladoProductoOrm } from './traslado-producto.orm';
import { ProductoOrm } from '../productos';
import { DetalleRemisionEntradaOrm } from './remision-entrada.detalle.orm';

@Entity(TABLE_NAMES.inn.dcm.tpd.trasladoProductoDetalle)
export class TrasladoProductoDetalleOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNNUMITE' })
  item: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'IDDCANTID' })
  cantidad: number;

  @Column({ name: 'INNTRASPROD' })
  trasladoProductoId: number;

  @ManyToOne(
    () => TrasladoProductoOrm,
    trasladoProducto => trasladoProducto.trasladoProductoDetalle
  )
  @JoinColumn([{ name: 'INNTRASPROD', referencedColumnName: 'id' }])
  trasladoProducto: TrasladoProductoOrm;

  @Column({ name: 'INNMREMEN' })
  detalleRemision: number;

  @ManyToOne(() => DetalleRemisionEntradaOrm)
  @JoinColumn([{ name: 'INNMREMEN', referencedColumnName: 'id' }])
  remisionDetalle: DetalleRemisionEntradaOrm;

  @Column({ name: 'ITPVALUNI' })
  valor: number;

  @Column({ name: 'ITPCANPEN' })
  cantidadPendiente: number;
}
