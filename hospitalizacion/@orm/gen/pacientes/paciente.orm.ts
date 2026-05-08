import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { GeneroCode, TipoDocumentoCode } from '@ctypes/gen/pacientes';
import { DetalleContratoOrm } from '../contratos';
import { IngresoOrm } from '@orm/adn/ingreso.orm';

@Entity('GENPACIEN')
export class PacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PACTIPDOC' })
  tipoDocCode: TipoDocumentoCode;

  @Column({ name: 'PACNUMDOC' })
  numeroDoc: string;

  @Column({ name: 'GPAFECEXP' })
  fechaExpDoc: Date;

  @Column({ name: 'PACEXPEDI' })
  lugarExpDoc: string;

  @Column({ name: 'PACPRINOM' })
  primerNombre: string;

  @Column({ name: 'PACSEGNOM' })
  segundoNombre: string;

  @Column({ name: 'PACPRIAPE' })
  primerApellido: string;

  @Column({ name: 'PACSEGAPE' })
  segundoApellido: string;

  @Column({ name: 'GPANOMCOM' })
  nombreCompleto: string;

  @Column({ name: 'GPAEMAIL' })
  email: string;

  @Column({ name: 'GPAFECNAC' })
  fechaNacimiento: Date;

  @Column({ name: 'GPASEXPAC' })
  generoCode: GeneroCode;

  @ManyToOne(() => DetalleContratoOrm)
  @JoinColumn([{ name: 'GENDETCON', referencedColumnName: 'id' }])
  detalleContrato: DetalleContratoOrm;

  @Column({ name: 'GPAFECING' })
  fechaIngreso: Date;

  @OneToMany(() => IngresoOrm, ingreso => ingreso.paciente)
  ingresos: IngresoOrm[];
}
