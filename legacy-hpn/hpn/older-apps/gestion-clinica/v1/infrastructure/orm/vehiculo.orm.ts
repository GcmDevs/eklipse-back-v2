import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AsignacionVehiculoOrm } from './asignacion-vehiculo.orm';
import { EmpleadoOrm } from './empleado.orm';

@Entity('HPNGTCVEHICULO')
export class VehiculoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PLACA' })
  placa: string;

  @OneToMany(() => AsignacionVehiculoOrm, asignacion => asignacion.vehiculo)
  asignaciones: AsignacionVehiculoOrm[];

  empleados: EmpleadoOrm[];
}
