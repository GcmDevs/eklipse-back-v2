import { TipoDocumentoCode } from '@hpn/lgc/tas/types/gen';
import { PacienteOrm } from '@hpn/lgc/tas/orm/gen';
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';

@Entity('EKHPNTRASLPACIENTE')
export class PacienteTrasladoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'GENPACIEN', nullable: true })
  pacienteId?: number;

  @Column({ name: 'NOMBRE', nullable: true })
  nombre?: string;

  @Column({ name: 'APELLIDO', nullable: true })
  apellido?: string;

  @Column({ name: 'TIPODOCUMENTO', nullable: true })
  tipoDocumentoCode?: TipoDocumentoCode;

  @Column({ name: 'NUMERODOCUMENTO', nullable: true })
  numeroDocumento?: string;

  @Column({ name: 'FECHANACIMIENTO', type: 'date', nullable: true })
  fechaNacimiento?: Date;

  @Column({ name: 'GENERO', nullable: true })
  generoCode?: number;

  @Column({ name: 'GRUPOSANGUINEO', nullable: true })
  grupoSanguineoCode?: number;

  @Column({ name: 'EPS', nullable: true })
  eps?: string;

  @Column({ name: 'ARL', nullable: true })
  arl?: string;

  @Column({ name: 'SOAT', nullable: true })
  soat?: string;

  @Column({ name: 'ESTADOCIVIL', type: 'int', nullable: true })
  estadoCivilCode: number;

  @Column({ name: 'DIRECCION', type: 'nvarchar', length: 250, nullable: true })
  direccion: string;

  @Column({ name: 'BARRIO', type: 'nvarchar', length: 150, nullable: true })
  barrio: string;

  @Column({ name: 'CELULAR', type: 'nvarchar', length: 30, nullable: true })
  celular: string;
}
