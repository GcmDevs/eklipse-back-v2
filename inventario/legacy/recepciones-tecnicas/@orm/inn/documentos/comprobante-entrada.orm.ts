import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Column } from 'typeorm';
import { DetalleComprobanteEntradaOrm } from './comprobante-entrada.detalle.orm';
import { RecepcionTecnicaOrm } from '../farmacia/recepcion-tecnica';
import { TABLE_NAMES } from '@common/application/constants';
import { TIPOS_DOCUMENTO } from '@inn/lgc/rct/types/inn/documentos';
import { DocumentoOrm } from './documento.orm';
import { AlmacenOrm } from '../productos';
import { ProveedorOrm } from '@inn/lgc/rct/orm/gen';

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
