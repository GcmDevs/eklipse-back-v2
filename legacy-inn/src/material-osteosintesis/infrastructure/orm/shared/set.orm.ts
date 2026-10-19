import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SetClasificacionOrm } from './clasificacion.orm';
import { SetProductoOrm } from './producto.orm';
import { SetLineaOrm } from './linea.orm';

@Entity('INNMOSET')
export class SetOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE', length: 300 })
  nombre: string;

  @Column({ name: 'INNMOSETLINEA' })
  lineaId: number;

  @ManyToOne(() => SetLineaOrm, linea => linea.sets)
  @JoinColumn({ name: 'INNMOSETLINEA' })
  linea: SetLineaOrm;

  @Column({ name: 'INNMOSETCLASIFI' })
  clasificacionId: number;

  @ManyToOne(() => SetClasificacionOrm, clasificacion => clasificacion.sets)
  @JoinColumn({ name: 'INNMOSETCLASIFI' })
  clasificacion: SetClasificacionOrm;

  @OneToMany(() => SetProductoOrm, producto => producto.set)
  productos: SetProductoOrm[];

  haveOferta = false;
  isModificado = false;
}
