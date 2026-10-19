import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { EstanteInventarioOrm } from './estantes-inventario.orm';
import { ConteoInventarioOrm } from './conteo-inventario.orm';
import { ProductoOrm } from '../productos';

@Entity('EKINNPRODUCTOESTANTE')
export class ProductoEstantesOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  // 🔹 FK al estante
  @Column({ name: 'EKINNESTANTES', type: 'int' })
  estanteId: number;

  // 🔹 FK al producto del módulo general
  @Column({ name: 'PRODUCTO', type: 'int' })
  productId: number;

  @Column({ name: 'STOCK', type: 'decimal', precision: 10, scale: 2 })
  stock: number;

  @Column({ name: 'UBICACION', type: 'varchar', length: 50, nullable: true })
  ubicacion: string | null;

  @Column({ name: 'TIPO', type: 'varchar', length: 20 })
  tipo: string;

  @Column({ name: 'ISACTIVO', default: true })
  isActivo: boolean;

  @Column({ name: 'ISACTIVOESTANTE', default: true })
  isActivoEstante: boolean;

  @ManyToOne(() => EstanteInventarioOrm, estante => estante.productos)
  @JoinColumn({ name: 'EKINNESTANTES' })
  estante: EstanteInventarioOrm;

  @ManyToOne(() => ProductoOrm, producto => producto.estantes)
  @JoinColumn({ name: 'PRODUCTO' })
  producto: ProductoOrm;

  // Conteo global asociado a este producto en este estante
  @OneToMany(() => ConteoInventarioOrm, conteoInventario => conteoInventario.estanteProducto)
  conteoInventario: ConteoInventarioOrm[];

  @Column({ name: 'FECHACREACION' })
  createdAt: Date;

  @Column({ name: 'FECHAMODIFICACION' })
  updatedAt: Date;

  @Column({ name: 'FECHAELIMINADO' })
  deletedAt: Date;

  @Column({ name: 'ISDELETED' })
  isDeleted: boolean;

  @Column({ name: 'USUARIOELIMINO', type: 'int' })
  usuarioElimmino: number;
}
