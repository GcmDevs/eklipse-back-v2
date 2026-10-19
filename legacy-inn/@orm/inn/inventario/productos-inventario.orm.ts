import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductoEstantesOrm } from './producto-estante.orm';

@Entity('EKINNPRODUCTOINVENTARIO')
export class ProductoInventarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO', type: 'varchar', length: 100, unique: true })
  codigo: string;

  @Column({ name: 'NOMBRE', type: 'varchar', length: 150 })
  nombre: string;

  @Column({ name: 'LABORATORIO', type: 'varchar', length: 150 })
  laboratorio: string;

  @Column({ name: 'TIPO', type: 'varchar', length: 150 })
  tipo: string;

  @Column({ name: 'EXISTENCIA', type: 'int' })
  existencia: number;

  @Column({ name: 'ISACTIVO', default: true })
  isActivo: boolean;

  @OneToMany(() => ProductoEstantesOrm, productosEstantes => productosEstantes.producto)
  productosEstantes: ProductoEstantesOrm[];

  @CreateDateColumn({ name: 'FECHACREACION' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'FECHAACTUALIZACION' })
  updatedAt: Date;
}
