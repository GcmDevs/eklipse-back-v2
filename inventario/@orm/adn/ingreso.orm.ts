import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ContratoOrm, PacienteOrm } from '../gen';
import { CentroOrm } from './centro.orm';
import { EstanciaOrm } from '../hpn';

@Entity('ADNINGRESO')
export class IngresoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutivo: string;

  @Column({ name: 'AINFECING' })
  fechaIngreso: Date;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @ManyToOne(() => PacienteOrm, paciente => paciente.ingresos)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @OneToOne(() => CentroOrm)
  @JoinColumn({ name: 'ADNCENATE', referencedColumnName: 'id' })
  centro: CentroOrm;

  @Column({ name: 'GENDETCON' })
  contratoId: number;

  @ManyToOne(() => ContratoOrm)
  @JoinColumn([{ name: 'GENDETCON', referencedColumnName: 'id' }])
  contrato: ContratoOrm;

  @OneToMany(() => EstanciaOrm, ingreso => ingreso.ingreso)
  estancias: EstanciaOrm[];
}
