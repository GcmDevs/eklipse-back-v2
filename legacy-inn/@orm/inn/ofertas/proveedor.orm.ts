import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EkinnoferCategoriaOrm } from './categoria.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { EkinnoferOfertaOrm } from './ofertas.orm';
import { EkinnoferOfertaDocOrm } from './oferta-doc.orm';

@Entity(TABLE_NAMES.inn.ofer.proveedores)
export class EkinnoferProveedorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERNUMDOC', type: 'varchar', length: 30, nullable: true })
  terNumDoc: string | null;

  @Column({ name: 'NOMBRE_TERCERO', type: 'varchar', length: 120, nullable: true })
  nombreTercero: string | null;

  @Column({ name: 'ESTADO', type: 'tinyint' })
  estado: number;

  @Column({ name: 'EKINNOFERCATEGORIA', type: 'int', nullable: true })
  categoriaId: number | null;

  @ManyToOne(() => EkinnoferCategoriaOrm, c => c.proveedores, { nullable: true })
  @JoinColumn({ name: 'EKINNOFERCATEGORIA', referencedColumnName: 'id' })
  categoria: EkinnoferCategoriaOrm | null;

  @OneToMany(() => EkinnoferOfertaOrm, o => o.proveedor)
  ofertas: EkinnoferOfertaOrm[];

  @OneToMany(() => EkinnoferOfertaDocOrm, o => o.proveedor)
  documentos: EkinnoferOfertaDocOrm[];
}
