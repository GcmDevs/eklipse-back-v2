import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, Column } from 'typeorm';
import { DetalleHojaProductoOrm } from './hoja-producto-detalle.orm';
import { IngresoOrm } from '@sln/orm/adn';

@Entity('SLNORDSER')
export class HojaProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => IngresoOrm, ingreso => ingreso.hojasProducto)
  @JoinColumn({ name: 'ADNINGRES1' })
  ingreso: IngresoOrm;

  @Column({ name: 'SOSFECORD' })
  fecha: Date;

  @OneToMany(() => DetalleHojaProductoOrm, detalle => detalle.hojaServicio)
  detalle: DetalleHojaProductoOrm[];
}
