import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { InformacionAdicionalOrm } from './informacion-adicional.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { ProductoOrm } from './producto.orm';
import { ProveedorOrm } from '@inn/lgc/ctc/orm/gen';

@Entity(TABLE_NAMES.inn.afn.activos)
export class ActivoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AACCODACT' })
  codigo: string;

  @Column({ name: 'AACNUMPLA' })
  placa: string;

  @Column({ name: TABLE_NAMES.inn.afn.productos })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.afn.productos, referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: TABLE_NAMES.gen.proveedores })
  proveedorId: number;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.proveedores, referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @OneToOne(() => InformacionAdicionalOrm, informacionAdicional => informacionAdicional.activo)
  informacionAdicional: InformacionAdicionalOrm;
}
