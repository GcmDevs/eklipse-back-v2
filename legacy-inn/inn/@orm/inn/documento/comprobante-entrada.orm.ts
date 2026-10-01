import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RSAServices } from '@common/application/services';
import { DocumentoOrm } from '../documento/documento.orm';
import { TIPOS_DOCUMENTO } from '@inn/ek-types/inn/documentos';
import { DetalleComprobanteEntradaOrm } from './comprobante-entrada.detalle.orm';

@Entity('INNCCOMPR')
export class ComprobanteEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  tipo = TIPOS_DOCUMENTO.comprobanteEntrada;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @OneToMany(() => DetalleComprobanteEntradaOrm, detalle => detalle.comprobanteEntrada)
  detalle: DetalleComprobanteEntradaOrm[];

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}
