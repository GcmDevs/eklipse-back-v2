import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { TABLE_NAMES } from '@common/application/constants';
import { EkinnoferCategoriaOrm } from './categoria.orm';
import { EkinnoferProductoOrm } from './producto.orm';
import { EkinnoferProveedorOrm } from './proveedor.orm';
import { EkinnoferOfertaDocOrm } from './oferta-doc.orm';

@Entity(TABLE_NAMES.inn.ofer.ofertas)
export class EkinnoferOfertaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO', type: 'tinyint' })
  estado: number;

  @Column({ name: 'FECHA_OFERTA', type: 'datetime', nullable: true })
  fechaOferta: Date | null;

  @Column({ name: 'EKINNOFERCATEGORIA', type: 'int', nullable: true })
  categoriaId: number | null;

  @ManyToOne(() => EkinnoferCategoriaOrm, { nullable: true })
  @JoinColumn({ name: 'EKINNOFERCATEGORIA', referencedColumnName: 'id' })
  categoria: EkinnoferCategoriaOrm | null;

  @Column({ name: 'EKINNOFERPRODUCTO', type: 'int', nullable: true })
  productoId: number | null;

  @ManyToOne(() => EkinnoferProductoOrm, { nullable: true })
  @JoinColumn({ name: 'EKINNOFERPRODUCTO', referencedColumnName: 'id' })
  producto: EkinnoferProductoOrm | null;

  @Column({ name: 'EKINNOFERPROVEEDOR', type: 'int', nullable: true })
  proveedorId: number | null;

  @ManyToOne(() => EkinnoferProveedorOrm, { nullable: true })
  @JoinColumn({ name: 'EKINNOFERPROVEEDOR', referencedColumnName: 'id' })
  proveedor: EkinnoferProveedorOrm | null;

  @Column({ name: 'PRINCIPIO', type: 'varchar', nullable: true })
  principio: string | null;

  @Column({ name: 'CONCENTRACION', type: 'varchar', nullable: true })
  concentracion: string | null;

  @Column({ name: 'MARCA', type: 'varchar', nullable: true })
  marca: string | null;

  @Column({ name: 'EXPEDIENTE', type: 'varchar', nullable: true })
  expediente: string | null;

  @Column({ name: 'CONCECUTIVO', type: 'varchar', nullable: true })
  concecutivo: string | null;

  @Column({ name: 'REGISTRO_SANITARIO', type: 'varchar', nullable: true })
  registroSanitario: string | null;

  @Column({ name: 'FECHA_VENCIMIENTO_REGISTRO', type: 'date', nullable: true })
  fechaVencimientoRegistro: Date | null;

  @Column({ name: 'ESTADO_REGISTRO', type: 'varchar', nullable: true })
  estadoRegistro: string | null;

  @Column({ name: 'CLASIFICACION_RIESGO', type: 'varchar', nullable: true })
  clasificacionRiesgo: string | null;

  @Column({ name: 'PRECIO_UNITARIO', type: 'decimal', precision: 18, scale: 2, nullable: true })
  precioUnitario: string | null;

  @Column({ name: 'IVA', type: 'decimal', precision: 5, scale: 2, nullable: true })
  iva: string | null;

  @Column({ name: 'PRESENTACION', type: 'varchar', nullable: true })
  presentacion: string | null;

  @Column({ name: 'PRECIO_PRESENTACION', type: 'decimal', precision: 18, scale: 2, nullable: true })
  precioPresentacion: string | null;

  @Column({ name: 'REGULADO', type: 'varchar', nullable: true })
  regulado: string | null;

  @OneToMany(() => EkinnoferOfertaDocOrm, d => d.oferta)
  documentos: EkinnoferOfertaDocOrm[];
}
