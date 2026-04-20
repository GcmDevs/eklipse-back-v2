import { Entity, OneToMany, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IngresoOrm } from '../adn';

@Entity('GENPACIEN')
export class PacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PACNUMDOC' })
  numDoc: string;

  @Column({ name: 'GPAFECEXP' })
  fecExpDoc: Date;

  @Column({ name: 'PACEXPEDI' })
  lugarExpDoc: string;

  @Column({ name: 'GPANOMCOM' })
  nombreCompleto: string;

  @Column({ name: 'GPAFECNAC' })
  fechaNacimiento: Date;

  @OneToMany(() => IngresoOrm, ingreso => ingreso.paciente)
  ingresos: IngresoOrm[];
}
