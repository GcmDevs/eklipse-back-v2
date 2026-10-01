import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { SolicitudTrasladoOrm } from './solicitud-traslado.orm';
import { IngresoOrm } from './ingreso.orm';
import { PacienteOrm, UsuarioOrm } from '@orm/gen';

@Entity({ name: 'GCMHPNGESTI' })
export class GestionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TITULO' })
  title: string;

  @Column({ name: 'INFOADICIO' })
  content: string;

  @Column({ name: 'PRIORIDAD' })
  priority: number;

  @Column({ name: 'ESTADOGESTION' })
  state: number;

  @Column({ name: 'ASIGNADAPOR' })
  createdBy: number;

  @Column({ name: 'PROCESADAPOR' })
  inProcessBy: number;

  @Column({ name: 'PROCESADAPORCENATE' })
  centroProcesamiento: number;

  @Column({ name: 'CERRADAPOR' })
  closedBy: number;

  @Column({ name: 'CERRADAPORCENATE' })
  centroCierre: number;

  @Column({ name: 'GENPACIEN' })
  patient: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'AINCONSEC' })
  consecutive: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn({ name: 'AINCONSEC', referencedColumnName: 'consecutive' })
  ingreso: IngresoOrm;

  @Column({ name: 'AREASIGNADA' })
  area: number;

  @Column({ name: 'FECHREGISTRO' })
  createdAt: Date;

  @Column({ name: 'FECHPROCESO' })
  inProcessAt: Date;

  @Column({ name: 'FECHCIERRE' })
  closedAt: Date;

  @Column({ name: 'ACTUALIZADO' })
  updatedTimes: number;

  @OneToOne(() => SolicitudTrasladoOrm, solicitud => solicitud.gestion)
  solicitudAmbulancia: SolicitudTrasladoOrm;

  @Column({ name: 'CANCELADAPOR' })
  canceladoPorId: number;

  @Column({ name: 'CANCELADAPORCENATE' })
  centroCancelacion: number;

  @Column({ name: 'FECHCANC' })
  fechaCancelacion: Date;

  @Column({ name: 'CANCOBSERVA' })
  observacionCance: string;

  @Column({ name: 'MOTCANCELACION' })
  motivoCancelacion: number;

  @Column({ name: 'TIPOGESTI' })
  tipoGestion: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'CANCELADAPOR', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;
}
