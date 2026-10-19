import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SetClasificacionOrm } from './clasificacion.orm';
import { SetProductoOrm } from './producto.orm';
import { SetOrm } from './set.orm';

@Entity('INNMOSETLINEA')
export class SetLineaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE', length: 100 })
  nombre: string;

  @OneToMany(() => SetClasificacionOrm, clasificacion => clasificacion.linea)
  clasificaciones: SetClasificacionOrm[];

  @OneToMany(() => SetOrm, set => set.linea)
  sets: SetOrm[];

  @OneToMany(() => SetProductoOrm, producto => producto.linea)
  productos: SetProductoOrm[];
}
