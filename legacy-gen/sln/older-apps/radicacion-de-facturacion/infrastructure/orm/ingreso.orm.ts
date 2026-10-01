import { Entity, Column, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';
import { CentroOrm } from './centro.orm';
import { PacienteOrm } from './paciente.orm';

@Entity('ADNINGRESO')
export class IngresoOrm {
  @PrimaryColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutivo: string;

  @ManyToOne(() => CentroOrm)
  @JoinColumn({ name: 'ADNCENATE' })
  centro: CentroOrm;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn({ name: 'GENPACIEN' })
  paciente: PacienteOrm;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  get originalColumnName() {
    return 'ADNINGRESO';
  }
}
