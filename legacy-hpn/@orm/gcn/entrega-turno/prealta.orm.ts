import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IngresoOrm, PacienteOrm, UsuarioOrm } from '@orm/gen';

@Entity(TABLE_NAMES.hpn.entregaTurno.prealta)
export class ETPreAltaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn({ name: 'ADNINGRESO' })
  ingreso: IngresoOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn({ name: 'GENPACIEN' })
  paciente: PacienteOrm;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO' })
  usuario: UsuarioOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'HORA' })
  tiempoPrealta: number;

  @Column({ name: 'OBSERVACION' })
  observacion: string;
}
