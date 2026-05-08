import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'EKHPNPACTRAZENCUESTA' })
export class PacTrazEncuestaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'FECHAACTUALIZ' })
  fechaActualizacion: Date;

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  @Column({ name: 'FINALIZADA' })
  isFinalizada: boolean;
}
