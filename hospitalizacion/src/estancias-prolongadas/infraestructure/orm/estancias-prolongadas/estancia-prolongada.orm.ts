import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DominioAccionesOrm } from './dominio-acciones.orm';
import { EstanciaItemPreguntasOrm } from './estancia-item-preguntas.orm';
import { SeguimientoSemanaOrm } from './seguimiento-semana.orm';

@Entity({ name: 'EKHPNESTANCIAPROLONGADAS' })
export class EstanciasProlongadasOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'FECHAINGRESO', type: 'datetime' })
  fechaIngreso: Date;

  @Column({ name: 'INGRESO', type: 'int' })
  ingreso: number;

  @Column({ name: 'NOMBREPACIENTE', type: 'nvarchar', length: 250 })
  nombrePaciente: string;

  @Column({ name: 'DOCUMENTO', type: 'nvarchar', length: 50 })
  documento: string;

  @Column({ name: 'EDAD', type: 'int' })
  age: number;

  @Column({ name: 'CAMA', type: 'nvarchar', length: 50 })
  cama: string;

  @Column({ name: 'PISO', type: 'nvarchar', length: 100, nullable: true })
  piso: string;

  @Column({ name: 'MUNICIPIO', type: 'nvarchar', length: 150, nullable: true })
  municipio: string;

  @Column({ name: 'EPS', type: 'nvarchar', length: 150, nullable: true })
  eps: string;

  @Column({ name: 'AUDITOR', type: 'nvarchar', length: 150 })
  auditor: string;

  @Column({ name: 'MEDICOTRATANTE', type: 'nvarchar', length: 150, nullable: true })
  medicoTratante: string;

  @Column({ name: 'DIAGNOSTICO', type: 'nvarchar', length: 500, nullable: true })
  diagnostico: string;

  @Column({ name: 'LOSACTUAL', type: 'int' })
  currentLos: number;

  @Column({ name: 'NIVELRIESGO', type: 'nvarchar', length: 30 })
  nivelRiesgo: string;

  @Column({ name: 'SEDE', type: 'nvarchar', length: 150 })
  sede: string;

  @Column({ name: 'GRUPO', type: 'nvarchar', length: 150 })
  grupo: string;

  @Column({ name: 'SCORETOTAL', type: 'int' })
  scoreTotal: number;

  @Column({ name: 'NOTAS', type: 'nvarchar', length: 1000, nullable: true })
  notas: string;

  @Column({ name: 'ESTADO', type: 'tinyint' })
  estado: boolean;

  @Column({ name: 'USUARIOCREACION', type: 'int' })
  usuarioCreacionId: number;

  @Column({ name: 'USUARIOCERRO', type: 'int', nullable: true })
  usuarioCerroId: number;

  @Column({ name: 'FECHACIERRE', type: 'datetime', nullable: true })
  fechaCierre: Date;

  @Column({ name: 'FECHAEGRESO', type: 'date', nullable: true })
  fechaEgreso: Date;

  @Column({ name: 'LOSTOTAL', type: 'int', nullable: true })
  losTotal: number;

  @Column({ name: 'DESTINOFINALCODIGO', type: 'tinyint', nullable: true })
  destinoFinalCodigo: number;

  @Column({ name: 'FIRMAMEDICO', type: 'nvarchar', length: 250, nullable: true })
  firmaMedico: string;

  @Column({ name: 'LOSRESULTADOCODIGO', type: 'tinyint', nullable: true })
  losResultadoCodigo: number;

  @Column({ name: 'BARRERACRITICACODIGO', type: 'tinyint', nullable: true })
  barreraCriticaCodigo: number;

  @Column({ name: 'ACCIONEFECTIVA', type: 'nvarchar', length: 'MAX', nullable: true })
  accionEfectiva: string;

  @Column({ name: 'ACCIONINEFECTIVA', type: 'nvarchar', length: 'MAX', nullable: true })
  accionInefectiva: string;

  @Column({ name: 'LECCIONAPRENDIDA', type: 'nvarchar', length: 'MAX', nullable: true })
  leccionAprendida: string;

  @Column({ name: 'PROTOCOLOSUFICIENTECODIGO', type: 'tinyint', nullable: true })
  protocoloSuficienteCodigo: number;

  @Column({ name: 'OBSERVACIONESCIERRE', type: 'nvarchar', length: 'MAX', nullable: true })
  observacionesCierre: string;

  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATEDAT', type: 'datetime', nullable: true })
  updatedAt: Date;

  @OneToMany(() => EstanciaItemPreguntasOrm, preguntas => preguntas.estanciaProlongada)
  preguntas: EstanciaItemPreguntasOrm[];

  @OneToMany(() => DominioAccionesOrm, action => action.estanciaProlongada)
  acciones: DominioAccionesOrm[];

  @OneToMany(() => SeguimientoSemanaOrm, seguimiento => seguimiento.estanciaProlongada)
  seguimientos: SeguimientoSemanaOrm[];
}
