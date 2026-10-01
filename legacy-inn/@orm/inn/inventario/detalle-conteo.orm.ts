import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UsuarioConteoOrm } from './usuario-inventario.orm';
import { ConteoInventarioOrm } from './conteo-inventario.orm';

@Entity('EKINNCONTEODETALLE')
export class DetalleConteoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CONTEOINVENTARIO', type: 'int' })
  conteoInventarioId: number;

  @ManyToOne(() => ConteoInventarioOrm, ci => ci.detalleConteo, {
    nullable: false,
  })
  @JoinColumn({ name: 'CONTEOINVENTARIO' })
  conteoInventario: ConteoInventarioOrm;

  @Column({ name: 'USUARIOCONTEO', type: 'int' })
  usuarioId: number;

  @ManyToOne(() => UsuarioConteoOrm, user => user.detalleConteo, {
    nullable: false,
  })
  @JoinColumn({ name: 'USUARIOCONTEO' })
  usuario: UsuarioConteoOrm;

  @Column({ type: 'int', name: 'NUMEROCONTEO' })
  numeroConteo: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'CANTIDADCONTADA',
  })
  cantidadContada: number;

  @Column({ name: 'COINCIDENCIASISTEMA' })
  coincidenciaSistema: boolean;

  @Column({ name: 'FECHACONTEO' })
  countedAt: Date;
}
