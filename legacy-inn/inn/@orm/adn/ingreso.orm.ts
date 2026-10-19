import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PacienteOrm } from '@inn/orm/gen';
import { EstanciaOrm } from '@inn/orm/hpn';

@Entity('ADNINGRESO')
export class IngresoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutivo: string;

  @ManyToOne(() => PacienteOrm, paciente => paciente.ingresos)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @OneToMany(() => EstanciaOrm, ingreso => ingreso.ingreso)
  estancias: EstanciaOrm[];

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @Column({ name: 'AINFECING' })
  fechaIngreso: Date;
}
