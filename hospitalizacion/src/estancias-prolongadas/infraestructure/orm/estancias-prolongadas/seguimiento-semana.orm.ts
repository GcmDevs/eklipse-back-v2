import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstanciasProlongadasOrm } from './estancia-prolongada.orm';

@Entity({ name: 'EKHPNSEGUIMIENTOSEMANA' })
export class SeguimientoSemanaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTANCIAPROLONGADAID', type: 'int' })
  estanciaProlongadaId: number;

  @Column({ name: 'SEMANANUMERO', type: 'tinyint' })
  semanaNumero: number;

  @Column({ name: 'FECHASEGUIMIENTO', type: 'date' })
  fechaSeguimiento: Date;

  @Column({ name: 'ESCRITICA', type: 'bit' })
  esCritica: boolean;

  @Column({ name: 'ESTADOCODIGO', type: 'tinyint' })
  estadoCodigo: number;

  @Column({ name: 'DESTINOCODIGO', type: 'tinyint', nullable: true })
  destinoCodigo: number;

  @Column({ name: 'ACCIONCODIGO', type: 'tinyint', nullable: true })
  accionCodigo: number;

  @Column({ name: 'RESPONSABLE', type: 'nvarchar', length: 200, nullable: true })
  responsable: string;

  @Column({ name: 'EGRESOESTIMADO', type: 'date', nullable: true })
  egresoEstimado: Date;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 'MAX', nullable: true })
  observaciones: string;

  @Column({ name: 'ESCALADA', type: 'nvarchar', length: 300, nullable: true })
  escalada: string;

  @Column({ name: 'CREADOPOR', type: 'nvarchar', length: 200, nullable: true })
  creadoPor: string;

  @Column({ name: 'USUARIOCREACION', type: 'int', nullable: true })
  usuarioCreacionId: number;

  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATEDAT', type: 'datetime', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => EstanciasProlongadasOrm, estancia => estancia.seguimientos)
  @JoinColumn({ name: 'ESTANCIAPROLONGADAID' })
  estanciaProlongada: EstanciasProlongadasOrm;
}
