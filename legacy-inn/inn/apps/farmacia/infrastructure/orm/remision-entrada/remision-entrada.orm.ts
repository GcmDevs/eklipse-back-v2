import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TIPOS_DOCUMENTO } from '../../../domain/types/rec-tec';
import { ProveedorOrm } from '../proveedor.orm';
import { RecepcionTecnicaOrm } from '../recepcion-tecnica/recepcion-tecnica.orm';
import { DetalleRemisionEntradaOrm } from './detalle.orm';
import { DocumentoOrm } from '../documento.orm';
import { AlmacenProductoOrm } from '@inn/orm/inn';

@Entity('INNCREMEN')
export class RemisionEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  tipo = TIPOS_DOCUMENTO.remisionEntrada;

  consecutivo: string;
  createdAt: Date;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: 'GENPROVEE', referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @ManyToOne(() => AlmacenProductoOrm)
  @JoinColumn([{ name: 'INNALMACE', referencedColumnName: 'id' }])
  almacen: AlmacenProductoOrm;

  @Column({ name: 'INNALMACE' })
  almacenId: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @OneToMany(() => DetalleRemisionEntradaOrm, detalle => detalle.remisionEntrada)
  detalle: DetalleRemisionEntradaOrm[];

  @OneToMany(() => RecepcionTecnicaOrm, recTec => recTec.documento)
  recepcionesTecnicas: RecepcionTecnicaOrm[];

  codigoFactura: string = null;
  fechaFactura: Date = null;
  comprobanteEntradaConsecutivo: string = null;
}
