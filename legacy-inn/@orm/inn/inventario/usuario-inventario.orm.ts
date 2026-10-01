import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { DetalleConteoOrm } from './detalle-conteo.orm';
import { UsuarioOrm } from '@orm/gen';
import { AsignacionConteoOrm } from './asignacion-conteo.orm';
import { RolUsuarioConteoCode } from '@ctypes/inn/inventario';

@Entity('EKINNUSUARIOCONTEO')
export class UsuarioConteoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  // 🔹 FK al usuario global del sistema
  @Column({ name: 'USUARIOID', type: 'int' })
  usuarioId: number;

  /** Roles asignados al usuario (CONTEO_I, CONTEO_II, CONTEO_III, ADMIN, etc.) */
  @Column({ name: 'ROLES' })
  roles: RolUsuarioConteoCode;

  @Column({ name: 'ISACTIVO', default: true })
  isActive: boolean;

  @Column({ name: 'FECHACREACION' })
  createdAt: Date;

  @Column({ name: 'FECHAACTUALIZACION' })
  updatedAt: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'USUARIOID', referencedColumnName: 'id' })
  usuario: UsuarioOrm;

  @OneToMany(() => DetalleConteoOrm, countDetail => countDetail.usuario)
  detalleConteo: DetalleConteoOrm[];

  @OneToMany(() => AsignacionConteoOrm, asignacion => asignacion.usuario)
  asignaciones: AsignacionConteoOrm[];
}
