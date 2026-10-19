import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { DetalleConteoOrm } from './detalle-conteo.orm';
import { ProductoEstantesOrm } from './producto-estante.orm';
import { EstadoConteoCode } from '@ctypes/inn/inventario';
import { CicloInventarioOrm } from './ciclo-inventario.orm';

@Entity('EKINNCONTEOINVENTARIO')
export class ConteoInventarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTANTEPRODUCTO', type: 'int' })
  estanteProductoId: number;

  @Column({ name: 'CICLO', type: 'int', nullable: true })
  cicloId: number | null;

  @Column({ name: 'ESTADOCONTEO', type: 'int' })
  estado: EstadoConteoCode;

  @Column({ type: 'int', default: 0, name: 'TOTALCONTEOREALIZADO' })
  totalConteoRealizado: number;

  // Si algún conteo coincide con el sistema (1, 2 o 3)
  @Column({ type: 'int', nullable: true, name: 'NUMEROCONTEOCOINCIDENTE' })
  numeroConteoCoincidente: number | null;

  @Column({ name: 'ISCERRADO', default: false })
  isCerrado: boolean;

  @Column({ name: 'CANTIDADOFICIAL', type: 'int' })
  cantidadOficial: number;

  @Column({ name: 'FECHACERRADO' })
  closedAt: Date;

  @ManyToOne(() => ProductoEstantesOrm, estanteProducto => estanteProducto.conteoInventario)
  @JoinColumn({ name: 'ESTANTEPRODUCTO' })
  estanteProducto: ProductoEstantesOrm;

  @ManyToOne(() => CicloInventarioOrm, ciclo => ciclo.asignaciones)
  @JoinColumn({ name: 'CICLO' })
  ciclo: CicloInventarioOrm;

  @OneToMany(() => DetalleConteoOrm, detalleConteo => detalleConteo.conteoInventario)
  detalleConteo: DetalleConteoOrm[];

  @Column({ name: 'EXISTENCIAACTUALPRODUCTO', type: 'int' })
  existenciaActualProducto: number;

  @CreateDateColumn({ name: 'FECHACREACION' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'FECHAACTUALIZACION' })
  updatedAt: Date;
}
