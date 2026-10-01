import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { DocumentoOrm, OrdenDespachoOrm } from '@orm/inn/documentos';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.dcm.odp.relacionDocumento)
export class OrdenDespachoDocumentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  documentoId: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @OneToOne(() => OrdenDespachoOrm, ordenDespacho => ordenDespacho.documentoRelacionado)
  @JoinColumn([{ name: TABLE_NAMES.inn.dcm.odp.ordenesDespacho, referencedColumnName: 'id' }])
  ordenDespacho: OrdenDespachoOrm;
}
