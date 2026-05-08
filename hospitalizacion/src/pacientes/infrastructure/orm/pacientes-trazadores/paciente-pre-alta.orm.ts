import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { IngresoOrm } from '@orm/adn/ingreso.orm';
import { PacienteOrm } from '@orm/gen/pacientes';
import { UsuarioOrm } from '@orm/gen/usuarios';

@Entity({ name: 'EKHPNENTREGATURNOPREALTA' })
export class PacientePreAltaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn({ name: 'ADNINGRESO', referencedColumnName: 'id' })
  ingreso: IngresoOrm;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn({ name: 'GENPACIEN', referencedColumnName: 'id' })
  paciente: PacienteOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO', referencedColumnName: 'id' })
  usuario: UsuarioOrm;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'HORA' })
  hora: number;

  @Column({ name: 'OBSERVACION' })
  observacion: string;
}
