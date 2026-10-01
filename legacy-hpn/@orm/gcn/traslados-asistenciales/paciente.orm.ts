import { TipoDocumentoCode } from '@ctypes/gen';
import { PacienteDataRes } from '@gestion-clinica/traslados-asistenciales/application/responses';
import { PacienteOrm } from '@orm/gen';
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

  @Column({ name: 'EDAD', nullable: true })
  edad?: number;

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
}
