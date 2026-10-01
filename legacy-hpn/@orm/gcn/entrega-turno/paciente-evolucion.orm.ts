import { TABLE_NAMES } from '@common/application/constants';
import { IngresoOrm, PacienteOrm } from '@orm/gen';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ETPacienteTurnoOrm } from './paciente-turno.orm';

@Entity(TABLE_NAMES.hpn.entregaTurno.pacienteEvolucion)
export class PacienteEvolucionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;
  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  usuarioId: number;

  @Column({ name: TABLE_NAMES.gen.pct.pacientes })
  pacienteId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.pct.pacientes, referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: TABLE_NAMES.adn.ingresos, referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'EVOLUCION' })
  evolucion: string;

  @Column({ name: 'FECHA' })
  fecha: Date;

  @OneToMany(() => ETPacienteTurnoOrm, pt => pt.pacienteEvolucion)
  pacientesTurnos: ETPacienteTurnoOrm[];
}
