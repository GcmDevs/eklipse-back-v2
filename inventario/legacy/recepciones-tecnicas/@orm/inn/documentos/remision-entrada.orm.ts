import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Column } from 'typeorm';
import { DetalleRemisionEntradaOrm } from './remision-entrada.detalle.orm';
import { RecepcionTecnicaOrm } from '../farmacia/recepcion-tecnica';
import { TABLE_NAMES } from '@common/application/constants';
import { TIPOS_DOCUMENTO } from '@inn/lgc/rct/types/inn/documentos';
import { DocumentoOrm } from './documento.orm';
import { AlmacenOrm } from '../productos';
import { ProveedorOrm } from '@inn/lgc/rct/orm/gen';

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
