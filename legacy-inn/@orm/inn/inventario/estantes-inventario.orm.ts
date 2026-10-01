import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AlmacenOrm } from '../productos';
import { ProductoEstantesOrm } from './producto-estante.orm';
import { AsignacionConteoOrm } from './asignacion-conteo.orm';

@Entity('EKINNESTANTES')
export class EstanteInventarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBREESTANTE', type: 'varchar', length: 50 })
  nombreEstante: string;

  @ManyToOne(() => AlmacenOrm, almacen => almacen.estantes)
  @JoinColumn({ name: 'ALMACEN', referencedColumnName: 'id' })
  almacen: AlmacenOrm;

  @Column({ name: 'ALMACEN', type: 'int' })
  almacenId: number;

  @Column({ name: 'ESTADO', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado: 'PENDIENTE' | 'PROGRESO' | 'COMPLETADO';

  @OneToMany(() => ProductoEstantesOrm, producto => producto.estante)
  productos: ProductoEstantesOrm[];

  @OneToMany(() => AsignacionConteoOrm, asignacion => asignacion.estante)
  asignaciones: AsignacionConteoOrm[];

  @Column({ name: 'FECHACREACION' })
  createdAt: Date;

  @Column({ name: 'FECHAMODIFICACION' })
  updatedAt: Date;
}
