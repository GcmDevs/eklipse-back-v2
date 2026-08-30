import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  EstadoAfnActivoCode,
  EstadoAfnActivoType,
  estadoAfnActivoTypeFactory,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { InformacionAdicionalOrm } from './informacion-adicional.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { ResponsableOrm } from './responsable.orm';
import { ProductoOrm } from './producto.orm';
import { ProveedorOrm } from '@inn/lgc/afn/orm/gen';

@Entity(TABLE_NAMES.inn.afn.activos)
export class ActivoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AACCODACT' })
  codigo: string;

  @Column({ name: 'AACNUMPLA' })
  placa: string;

  @Column({ name: 'AACESTADO' })
  estadoCode: EstadoAfnActivoCode;

  estado: EstadoAfnActivoType;

  @Column({ name: TABLE_NAMES.inn.afn.responsables })
  responsableId: number;

  @ManyToOne(() => ResponsableOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.afn.responsables, referencedColumnName: 'id' }])
  responsable: ResponsableOrm;

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

  setTypes() {
    this.estado = estadoAfnActivoTypeFactory(this.estadoCode, false);
  }
}
