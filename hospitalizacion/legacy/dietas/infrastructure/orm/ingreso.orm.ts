import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PacienteOrm } from './paciente.orm';

@Entity('ADNINGRESO')
export class IngresoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutivo: string;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @Column({ name: 'AINFECING' })
  fechaIngreso: Date;
}
