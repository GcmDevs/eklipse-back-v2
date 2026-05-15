import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LineaOrm } from './set-linea.orm';
import { ClasificacionOrm } from './set-clasificacion.orm';
import { ProductoOrm } from './producto.orm';

@Entity('INNMOSET')
export class SetOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'INNMOSETLINEA' })
  lineaId: number;

  @ManyToOne(() => LineaOrm, linea => linea.sets)
  @JoinColumn({ name: 'INNMOSETLINEA' })
  linea: LineaOrm;

  @Column({ name: 'INNMOSETCLASIFI' })
  clasificacionId: number;

  @ManyToOne(() => ClasificacionOrm, clasifi => clasifi.sets)
  @JoinColumn({ name: 'INNMOSETCLASIFI' })
  clasificacion: ClasificacionOrm;

  @Column({ name: 'ACTIVO' })
  activo: boolean;

  @OneToMany(() => ProductoOrm, produc => produc.set)
  productos: ProductoOrm[];
}
