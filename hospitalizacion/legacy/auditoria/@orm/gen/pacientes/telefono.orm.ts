import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PacienteOrm } from './paciente.orm';

@Entity('GENPACIENT')
export class TelefonoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => PacienteOrm, paciente => paciente.telefono)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'PACTELEFONO' })
  telefono: string;
}
