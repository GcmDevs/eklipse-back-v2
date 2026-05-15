import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ClasificacionOrm } from './set-clasificacion.orm';
import { ProductoOrm } from './producto.orm';
import { SetOrm } from './set.orm';

@Entity('INNMOSETLINEA')
export class LineaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @OneToMany(() => ClasificacionOrm, clasifi => clasifi.linea)
  clasificaciones: ClasificacionOrm[];

  @OneToMany(() => ProductoOrm, produc => produc.linea)
  productos: ProductoOrm[];

  @OneToMany(() => SetOrm, set => set.linea)
  sets: SetOrm[];
}
