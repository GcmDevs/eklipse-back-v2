import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PacienteOrm } from '../pacientes';

@Entity('GENPACIEND')
export class DireccionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => PacienteOrm, paciente => paciente.direccion)
  @JoinColumn({ name: 'GENPACIEN' })
  paciente: PacienteOrm;

  @Column({ name: 'PACDIRECCION' })
  direccion: string;
}
