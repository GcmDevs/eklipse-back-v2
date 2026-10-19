import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RecepcionTecnicaOrm } from '../recepcion-tecnica/recepcion-tecnica.orm';
import { DetalleComprobanteEntradaOrm } from './detalle.orm';
import { RSAServices } from '@common/application/services';
import { TIPOS_DOCUMENTO } from '../../../domain/types/rec-tec';
import { ProveedorOrm } from '../proveedor.orm';
import { DocumentoOrm } from '../documento.orm';
import { AlmacenProductoOrm } from '@inn/orm/inn';

@Entity('INNCCOMPR')
export class ComprobanteEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  tipo = TIPOS_DOCUMENTO.comprobanteEntrada;

  consecutivo: string;
  createdAt: Date;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: 'GENTERCERP', referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @OneToMany(() => DetalleComprobanteEntradaOrm, detalle => detalle.comprobanteEntrada)
  detalle: DetalleComprobanteEntradaOrm[];

  @ManyToOne(() => AlmacenProductoOrm)
  @JoinColumn([{ name: 'INNALMACE', referencedColumnName: 'id' }])
  almacen: AlmacenProductoOrm;

  @Column({ name: 'INNALMACE' })
  almacenId: number;

  @OneToMany(() => RecepcionTecnicaOrm, recTec => recTec.documento)
  recepcionesTecnicas: RecepcionTecnicaOrm[];

  @Column({ name: 'ICCFACPRO' })
  codigoFactura: string;

  @Column({ name: 'ICCFECFAC' })
  fechaFactura: Date;

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}
