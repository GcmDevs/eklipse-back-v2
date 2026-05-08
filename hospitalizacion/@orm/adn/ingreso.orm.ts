import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CausaIngresoCode, FormaIngresoCode, TipoIngresoCode } from '@ctypes/adn/ingresos';
import { DetalleContratoOrm } from '@orm/gen/contratos';
import { PacienteOrm } from '@orm/gen/pacientes';

@Entity('ADNINGRESO')
export class IngresoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutivo: string;

  @Column({ name: 'AINURGCON' })
  formaCode: FormaIngresoCode;

  @Column({ name: 'AINCAUING' })
  causaCode: CausaIngresoCode;

  @Column({ name: 'AINTIPING' })
  claseCode: TipoIngresoCode;

  @Column({ name: 'AINFECING' })
  fechaIngreso: Date;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'GENDETCON' })
  detalleContratoId: number;

  @ManyToOne(() => DetalleContratoOrm)
  @JoinColumn([{ name: 'GENDETCON', referencedColumnName: 'id' }])
  detalleContrato: DetalleContratoOrm;
}
