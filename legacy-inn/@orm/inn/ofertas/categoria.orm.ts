import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.ofer.categorias)
export class EkinnoferCategoriaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO', type: 'tinyint' })
  estado: number;

  @Column({ name: 'NOMBRE', type: 'varchar', length: 100, nullable: true })
  nombre: string | null;

  @OneToMany(() => EkinnoferProductoOrm, p => p.categoria)
  productos: EkinnoferProductoOrm[];

  @OneToMany(() => EkinnoferProveedorOrm, p => p.categoria)
  proveedores: EkinnoferProveedorOrm[];

  @OneToMany(() => EkinnoferOfertaOrm, o => o.categoria)
  ofertas: EkinnoferOfertaOrm[];
}

// 👇 Importa al final o ajusta rutas para evitar circularidad según tu estructura
import { EkinnoferProductoOrm } from './producto.orm';
import { EkinnoferProveedorOrm } from './proveedor.orm';
import { EkinnoferOfertaOrm } from './ofertas.orm';
