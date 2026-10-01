import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { EkinnoferOfertaOrm } from './ofertas.orm';
import { EkinnoferProveedorOrm } from './proveedor.orm';

@Entity(TABLE_NAMES.inn.ofer.oferta_docs)
export class EkinnoferOfertaDocOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO', type: 'tinyint', default: () => '1' })
  estado: number;

  @Column({ name: 'EKINNOFEROFERTA', type: 'int', nullable: true })
  ofertaId: number | null;

  @ManyToOne(() => EkinnoferOfertaOrm, { nullable: true })
  @JoinColumn({ name: 'EKINNOFEROFERTA', referencedColumnName: 'id' })
  oferta: EkinnoferOfertaOrm | null;

  @Column({ name: 'EKINNOFERCATEGORIA', type: 'int', nullable: true })
  categoriaId: number | null;

  @Column({ name: 'EKINNOFERPROVEEDOR', type: 'int', nullable: true })
  proveedorId: number | null;

  @Column({ name: 'DOC_ID', type: 'varchar', length: 10, nullable: true })
  docId: string | null;

  @Column({ name: 'NOMBRE_ARCHIVO', type: 'varchar', length: 260, nullable: true })
  nombreArchivo: string | null;

  @Column({ name: 'MIME_TYPE', type: 'varchar', length: 80, nullable: true })
  mimeType: string | null;

  @Column({ name: 'TAMANIO_BYTES', type: 'int', nullable: true })
  tamanioBytes: number | null;

  @Column({ name: 'RUTA', type: 'varchar', length: 500, nullable: true })
  ruta: string | null;

  @Column({ name: 'FECHA_CARGA', type: 'datetime', nullable: true })
  fechaCarga: Date | null;

  @ManyToOne(() => EkinnoferProveedorOrm, { nullable: true })
  @JoinColumn({ name: TABLE_NAMES.inn.ofer.proveedores, referencedColumnName: 'id' })
  proveedor: EkinnoferProveedorOrm | null;
}
