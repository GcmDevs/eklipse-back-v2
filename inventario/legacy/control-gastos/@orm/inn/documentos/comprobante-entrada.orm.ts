import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Column } from 'typeorm';
import { DetalleComprobanteEntradaOrm } from '@inn/lgc/cgt/orm/inn/documentos/comprobante-entrada.detalle.orm';
import { RecepcionTecnicaOrm } from '@inn/lgc/cgt/orm/inn/farmacia/recepcion-tecnica/recepcion-tecnica.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { TIPOS_DOCUMENTO } from '@inn/lgc/cgt/types/inn/documentos/tipos.type';
import { DocumentoOrm } from '@inn/lgc/cgt/orm/inn/documentos/documento.orm';
import { AlmacenOrm } from '@inn/lgc/cgt/orm/inn/productos/almacen.orm';
import { ProveedorOrm } from '@inn/lgc/cgt/orm/gen/proveedor.orm';

@Entity(TABLE_NAMES.inn.dcm.cet.comprobantesEntrada)
export class ComprobanteEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  tipo = TIPOS_DOCUMENTO.COMPROBANTE_ENTRADA;

  consecutivo: string;
  createdAt: Date;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.proveedores, referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @Column({ name: TABLE_NAMES.gen.proveedores })
  proveedorId: number;

  @ManyToOne(() => AlmacenOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.almacenes, referencedColumnName: 'id' }])
  almacen: AlmacenOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.almacenes })
  almacenId: number;

  @Column({ name: 'ICCFACPRO' })
  codigoFactura: string;

  @Column({ name: 'ICCFECFAC' })
  fechaFactura: Date;

  @OneToMany(() => DetalleComprobanteEntradaOrm, detalle => detalle.comprobanteEntrada)
  detalle: DetalleComprobanteEntradaOrm[];

  @OneToMany(() => RecepcionTecnicaOrm, recTec => recTec.documento)
  recepcionesTecnicas: RecepcionTecnicaOrm[];
}
