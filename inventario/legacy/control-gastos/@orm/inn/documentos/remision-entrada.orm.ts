import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Column } from 'typeorm';
import { DetalleRemisionEntradaOrm } from '@inn/lgc/cgt/orm/inn/documentos/remision-entrada.detalle.orm';
import { RecepcionTecnicaOrm } from '@inn/lgc/cgt/orm/inn/farmacia/recepcion-tecnica/recepcion-tecnica.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { TIPOS_DOCUMENTO } from '@inn/lgc/cgt/types/inn/documentos/tipos.type';
import { DocumentoOrm } from '@inn/lgc/cgt/orm/inn/documentos/documento.orm';
import { AlmacenOrm } from '@inn/lgc/cgt/orm/inn/productos/almacen.orm';
import { ProveedorOrm } from '@inn/lgc/cgt/orm/gen/proveedor.orm';

@Entity(TABLE_NAMES.inn.dcm.rme.remisionesEntrada)
export class RemisionEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  tipo = TIPOS_DOCUMENTO.REMISION_ENTRADA;

  consecutivo: string;
  createdAt: Date;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: 'GENPROVEE', referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @Column({ name: 'GENPROVEE' })
  proveedorId: number;

  @ManyToOne(() => AlmacenOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.almacenes, referencedColumnName: 'id' }])
  almacen: AlmacenOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.almacenes })
  almacenId: number;

  @OneToMany(() => DetalleRemisionEntradaOrm, detalle => detalle.remisionEntrada)
  detalle: DetalleRemisionEntradaOrm[];

  @OneToMany(() => RecepcionTecnicaOrm, recTec => recTec.documento)
  recepcionesTecnicas: RecepcionTecnicaOrm[];

  codigoFactura: string = null;
  fechaFactura: Date = null;
  comprobanteEntradaConsecutivo: string = null;
}
