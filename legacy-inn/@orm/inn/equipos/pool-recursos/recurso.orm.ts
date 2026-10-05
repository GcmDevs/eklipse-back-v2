import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Entity, Column, OneToMany } from 'typeorm';
import { AsingacionRecursoActividadOrm } from './asignacion-actividad-recurso.orm';
import { AsignacionRecursoUsuarioOrm } from './asignacion-usuario-recurso.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.pool_recursos.recursos })
export class RecursoOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE', type: 'nvarchar', length: 80 })
  nombre: string;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;

  @OneToMany(() => AsignacionRecursoUsuarioOrm, a => a.recurso, { cascade: true })
  asignaciones: AsignacionRecursoUsuarioOrm[];

  @OneToMany(() => AsingacionRecursoActividadOrm, a => a.recurso)
  asignacionesActividades: AsingacionRecursoActividadOrm[];
}
