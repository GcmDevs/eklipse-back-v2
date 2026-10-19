import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentoOrm } from './documento.orm';

@Entity('GCMINNESPECDISP')
export class EspecificacionDispOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'MARCA' })
  marca: string;

  @Column({ name: 'MODELO' })
  modelo: string;

  @Column({ name: 'SERIE' })
  serie: string;

  @Column({ name: 'DOCUMTECN' })
  documentoId: number;

  @OneToOne(() => DocumentoOrm, doc => doc.equipo)
  @JoinColumn({ name: 'DOCUMTECN', referencedColumnName: 'id' })
  documento: DocumentoOrm;
}
