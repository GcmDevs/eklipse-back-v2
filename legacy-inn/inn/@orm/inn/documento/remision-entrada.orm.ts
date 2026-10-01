import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RSAServices } from '@common/application/services';
import { TIPOS_DOCUMENTO } from '@inn/ek-types/inn/documentos';
import { DocumentoOrm } from '../documento/documento.orm';
import { DetalleRemisionEntradaOrm } from './remision-entrada.detalle.orm';

@Entity('INNCREMEN')
export class RemisionEntradaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  tipo = TIPOS_DOCUMENTO.remisionEntrada;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @OneToMany(() => DetalleRemisionEntradaOrm, detalle => detalle.remisionEntrada)
  detalle: DetalleRemisionEntradaOrm[];

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}
