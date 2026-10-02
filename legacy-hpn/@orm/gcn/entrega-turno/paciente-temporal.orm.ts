import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Clinical ownership while a patient remains in one specific temporary stay.
 * The stay id deliberately makes the assignment ineffective as soon as a new
 * stay is opened after moving the patient to another bed.
 */
@Entity(TABLE_NAMES.hpn.entregaTurno.pacienteTemporal)
export class PacienteTemporalOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HPNESTANC' })
  estanciaId: number;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  @Column({ name: TABLE_NAMES.gen.pct.pacientes })
  pacienteId: number;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @Column({ name: 'HPNSUBGRUDESTINO' })
  subgrupoDestinoId: number;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  usuarioAsignoId: number;

  @Column({ name: 'FECHAASIGNACION' })
  fechaAsignacion: Date;
}
