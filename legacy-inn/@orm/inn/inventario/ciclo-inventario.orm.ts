import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { AsignacionConteoOrm } from './asignacion-conteo.orm';
import { ConteoInventarioOrm } from './conteo-inventario.orm';

@Entity('EKINNCICLOSCONTEO')
export class CicloInventarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'ESTADO', type: 'varchar', length: 20, default: 'ABIERTO' })
  estado: 'ABIERTO' | 'CERRADO';

  @Column({ name: 'INICIO', nullable: true })
  inicio: Date;

  @Column({ name: 'FIN', nullable: true })
  fin: Date;

  @Column({ name: 'ESTANTE', type: 'int', nullable: true })
  estanteId: number | null;

  @OneToMany(() => AsignacionConteoOrm, a => a.ciclo)
  asignaciones: AsignacionConteoOrm[];

  @OneToMany(() => ConteoInventarioOrm, ci => ci.ciclo)
  conteosInventario: ConteoInventarioOrm[];

  @CreateDateColumn({ name: 'CREATEDAT' })
  createdAt: Date;
}
