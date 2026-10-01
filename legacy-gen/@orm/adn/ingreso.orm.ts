import { Entity, Column, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { CentroOrm } from './centro.orm';
import { PacienteOrm } from '@orm/gen';

@Entity(TABLE_NAMES.adn.ingresos)
export class IngresoOrm {
  @PrimaryColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutivo: string;

  @ManyToOne(() => CentroOrm)
  @JoinColumn({ name: TABLE_NAMES.adn.centros })
  centro: CentroOrm;

  @Column({ name: TABLE_NAMES.adn.centros })
  centroId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn({ name: TABLE_NAMES.gen.pct.pacientes })
  paciente: PacienteOrm;

  @Column({ name: TABLE_NAMES.gen.pct.pacientes })
  pacienteId: number;
}
