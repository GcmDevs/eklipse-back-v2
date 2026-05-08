import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from 'typeorm';
import { PacTrazPreguntaOrm } from './pregunta.orm';
import { PacTrazEncuestaOrm } from './encuesta.orm';

@Entity({ name: 'EKHPNPACTRAZENCRESPUES' })
export class PacTrazRespuestaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKHPNPACTRAZENCUESTA' })
  encuestaId: number;

  @OneToOne(() => PacTrazEncuestaOrm)
  @JoinColumn({ name: 'EKHPNPACTRAZENCUESTA', referencedColumnName: 'id' })
  encuesta: PacTrazEncuestaOrm;

  @Column({ name: 'EKHPNPACTRAZENCPREGUN' })
  preguntaId: number;

  @OneToOne(() => PacTrazPreguntaOrm)
  @JoinColumn({ name: 'EKHPNPACTRAZENCPREGUN', referencedColumnName: 'id' })
  pregunta: PacTrazPreguntaOrm;

  @Column({ name: 'RESBOOLEAN' })
  respuesta: boolean;

  @Column({ name: 'OBSERVACION', nullable: true })
  observacion: string;
}
