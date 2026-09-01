import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.hcn.folios.diagPaciente)
export class DiagPacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCPOBSERV' })
  observacion: string;

  @Column({ name: 'HCPDIAPRIN' })
  isPrincipal: boolean;
}
