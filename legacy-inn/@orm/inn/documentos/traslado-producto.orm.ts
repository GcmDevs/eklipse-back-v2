import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentoOrm } from './documento.orm';
import { TrasladoProductoDetalleOrm } from './traslado-producto-detalle.orm';

@Entity(TABLE_NAMES.inn.dcm.tpd.trasladoProducto)
export class TrasladoProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ITPESTPRO' })
  estadoProductos: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @Column({ name: 'INNALMCONSIG' })
  consignacionAlmacen: number;

  @Column({ name: 'INNALMPROPIO' })
  almacenPropio: number;

  @Column({ name: 'GENPROVEE' })
  proveedor: number;

  @Column({ name: 'ITPDETALLE' })
  detalle: string;

  @OneToMany(
    () => TrasladoProductoDetalleOrm,
    trasladoProductoDetalle => trasladoProductoDetalle.trasladoProducto
  )
  trasladoProductoDetalle: TrasladoProductoDetalleOrm[];
}
