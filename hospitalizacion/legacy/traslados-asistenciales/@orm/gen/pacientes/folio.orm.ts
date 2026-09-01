import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { MedicoOrm } from './medico.orm';
import { SltMedicamentoOrm } from './solicitud-medicamento.orm';
import { IndicacionesMedicasOrm } from './indicaciones-medicas.orm';

@Entity('HCNFOLIO')
export class FolioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCFECFOL' })
  fecha: Date;

  @Column({ name: 'GENMEDICO' })
  medicoId: string;

  @ManyToOne(() => MedicoOrm)
  @JoinColumn([{ name: 'GENMEDICO', referencedColumnName: 'id' }])
  medico: MedicoOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @Column({ name: 'HCNINDMED' })
  indicacionMedicId: number;

  @OneToOne(() => IndicacionesMedicasOrm)
  @JoinColumn([{ name: 'HCNINDMED', referencedColumnName: 'id' }])
  indicacionMedica: IndicacionesMedicasOrm;

  @OneToMany(() => SltMedicamentoOrm, medicamento => medicamento.folio)
  medicamentos: SltMedicamentoOrm[];

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  get originalColumnName() {
    return 'HCNFOLIO';
  }
}
