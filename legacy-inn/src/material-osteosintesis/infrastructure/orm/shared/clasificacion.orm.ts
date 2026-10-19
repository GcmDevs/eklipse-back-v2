import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SetProductoOrm } from './producto.orm';
import { SetLineaOrm } from './linea.orm';
import { SetOrm } from './set.orm';

@Entity('INNMOSETCLASIFI')
export class SetClasificacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE', length: 100 })
  nombre: string;

  @Column({ name: 'INNMOSETLINEA' })
  lineaId: number;

  @ManyToOne(() => SetLineaOrm, linea => linea.clasificaciones)
  @JoinColumn({ name: 'INNMOSETLINEA' })
  linea: SetLineaOrm;

  @OneToMany(() => SetOrm, sets => sets.clasificacion)
  sets: SetOrm[];

  @OneToMany(() => SetProductoOrm, producto => producto.clasificacion)
  productos: SetProductoOrm[];
}
