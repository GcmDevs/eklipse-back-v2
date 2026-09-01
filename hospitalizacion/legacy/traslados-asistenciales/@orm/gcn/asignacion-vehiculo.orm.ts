import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { VehiculoOrm } from './vehiculo.orm';
import { EmpleadoOrm } from './empleado.orm';
import { EkEmpleadoOrm } from './ek-empleado.orm';
import { TipoTurnoEmpleadoCode } from '@hpn/lgc/tas/types/gcn';
import { UsuarioOrm } from '@hpn/lgc/tas/orm/gen';

@Entity('GCMHPNGESTIASIGVEHI')
export class AsignacionVehiculoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GESTIVEHICULO' })
  vehiculoId: number;

  @ManyToOne(() => VehiculoOrm)
  @JoinColumn([{ name: 'GESTIVEHICULO', referencedColumnName: 'id' }])
  vehiculo: VehiculoOrm;

  @Column({ name: 'HPNAUXILIAR' })
  auxiliarId: number;

  @ManyToOne(() => EkEmpleadoOrm)
  @JoinColumn([{ name: 'HPNAUXILIAR', referencedColumnName: 'id' }])
  auxiliar: EkEmpleadoOrm;

  @Column({ name: 'HPNCONDUCTOR' })
  conductorId: number;

  @ManyToOne(() => EkEmpleadoOrm)
  @JoinColumn([{ name: 'HPNCONDUCTOR', referencedColumnName: 'id' }])
  conductor: EkEmpleadoOrm;

  @Column({ name: 'FECINICIAL' })
  fechaInicial: Date;

  @Column({ name: 'FECFIN' })
  fechaFin: Date;

  @Column({ name: 'TIPOTURNO' })
  tipoTurno: TipoTurnoEmpleadoCode;

  @Column({ name: 'ACTIVO' })
  isActivo: boolean;

  @Column({ name: 'ASIGNADOPOR' })
  asignadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'ASIGNADOPOR', referencedColumnName: 'id' }])
  asignadoPor: UsuarioOrm;

  empleados: EmpleadoOrm[] = [];
}
