import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { UsuarioConteoOrm } from './usuario-inventario.orm';
import { EstanteInventarioOrm } from './estantes-inventario.orm';
import { CicloInventarioOrm } from './ciclo-inventario.orm';

@Entity('EKINNASIGNACIONCONTEO')
export class AsignacionConteoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUARIOCONTEO', type: 'int' })
  usuarioId: number;

  @Column({ name: 'ESTANTE', type: 'int' })
  estanteId: number;

  @Column({ name: 'NUMEROCONTEO', type: 'int' })
  numeroConteo: number;

  @Column({ name: 'ISACTIVO', default: true })
  isActivo: boolean;

  @Column({ name: 'CICLO', type: 'int', nullable: true })
  cicloId: number | null;

  @ManyToOne(() => UsuarioConteoOrm, usuario => usuario.asignaciones)
  @JoinColumn({ name: 'USUARIOCONTEO' })
  usuario: UsuarioConteoOrm;

  @ManyToOne(() => EstanteInventarioOrm, estante => estante.asignaciones)
  @JoinColumn({ name: 'ESTANTE' })
  estante: EstanteInventarioOrm;

  @ManyToOne(() => CicloInventarioOrm, ciclo => ciclo.asignaciones)
  @JoinColumn({ name: 'CICLO' })
  ciclo: CicloInventarioOrm;

  @Column({ name: 'FECHASIGNACION' })
  fechaAsignacion: Date;

  @Column({ name: 'FECHAMODIFICACION' })
  updatedAt: Date;
}
