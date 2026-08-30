import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { PacienteOrm } from './paciente.orm';
import { CentroOrm } from '@inn/lgc/ctc/orm/adn';
import { ContratoOrm } from './contrato.orm';

@Entity(TABLE_NAMES.adn.ingresos)
export class IngresoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutivo: string;

  @Column({ name: 'AINFECING' })
  fechaIngreso: Date;

  @ManyToOne(() => PacienteOrm, paciente => paciente.ingresos)
  @JoinColumn([{ name: TABLE_NAMES.gen.pct.pacientes, referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: TABLE_NAMES.gen.pct.pacientes })
  pacienteId: number;

  @OneToOne(() => CentroOrm)
  @JoinColumn({ name: TABLE_NAMES.adn.centros, referencedColumnName: 'id' })
  centro: CentroOrm;

  @Column({ name: TABLE_NAMES.adn.centros })
  centroId: number;

  /* AGREGADO RECIENTEMENTE POR JESUS */
  @ManyToOne(() => ContratoOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.ctt.detalle, referencedColumnName: 'id' }])
  contrato: ContratoOrm;

  @Column({ name: TABLE_NAMES.gen.ctt.detalle })
  contratoId: number;
}
