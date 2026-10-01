import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EkinnoferCategoriaOrm } from './categoria.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { EkinnoferOfertaOrm } from './ofertas.orm';

@Entity(TABLE_NAMES.inn.ofer.productos)
export class EkinnoferProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO', type: 'tinyint' })
  estado: number;

  @Column({ name: 'EKINNOFERCATEGORIA', type: 'int', nullable: true })
  categoriaId: number | null;

  @ManyToOne(() => EkinnoferCategoriaOrm, c => c.productos, { nullable: true })
  @JoinColumn({ name: 'EKINNOFERCATEGORIA', referencedColumnName: 'id' })
  categoria: EkinnoferCategoriaOrm | null;

  @Column({ name: 'CODIGO', type: 'varchar', length: 20, nullable: true })
  codigo: string | null;

  @Column({ name: 'NOMBRE', type: 'varchar', length: 250, nullable: true })
  nombre: string | null;

  @Column({ name: 'CANTIDAD_TOTAL_2025', type: 'int', nullable: true })
  cantidadTotal2025: number | null;

  @OneToMany(() => EkinnoferOfertaOrm, o => o.producto)
  ofertas: EkinnoferOfertaOrm[];
}
