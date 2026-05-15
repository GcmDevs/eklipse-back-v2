import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LineaOrm } from './set-linea.orm';
import { ProductoOrm } from './producto.orm';
import { SetOrm } from './set.orm';

@Entity('INNMOSETCLASIFI')
export class ClasificacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'INNMOSETLINEA' })
  lineaId: number;

  @ManyToOne(() => LineaOrm, linea => linea.clasificaciones)
  @JoinColumn({ name: 'INNMOSETLINEA' })
  linea: LineaOrm;

  @OneToMany(() => ProductoOrm, produc => produc.clasificacion)
  productos: ProductoOrm[];

  @OneToMany(() => SetOrm, set => set.clasificacion)
  sets: SetOrm[];
}
