// formato-muestra-anatomopatologica.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DetalleMuestraCupsOrm } from './detalle-cups.orm';

@Entity({ name: 'formatomuestrasanatomopatologicas' })
@Index('idxmuestrafechatoma', ['fechaTomaMuestra'])
@Index('idxmuestranumerocaso', ['numeroCaso'])
@Index('idxmuestradocumento', ['numeroDocumento'])
export class FormatoMuestraAnatomopatologicaOrm {
  /**
   * Funciona como el N° consecutivo global del formato.
   */
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'numerocaso',
    type: 'varchar',
    length: 50,
  })
  numeroCaso: string;

  @Column({
    name: 'FECHATOMAMUESTRA',
    type: 'date',
  })
  fechaTomaMuestra: string;

  @Column({
    name: 'FECHARECEPCIONLABORATORIO',
    type: 'date',
  })
  fechaRecepcionLaboratorio: string;

  /**
   * Identifica el ingreso del censo usado al crear el registro.
   */
  @Column({
    name: 'INGRESO',
    type: 'bigint',
  })
  ingreso: number;

  /**
   * Snapshot de la información del paciente.
   */
  @Column({
    name: 'NOMBREPACIENTE',
    type: 'varchar',
    length: 200,
  })
  nombrePaciente: string;

  @Column({
    name: 'NUMERODOCUMENTO',
    type: 'varchar',
    length: 30,
  })
  numeroDocumento: string;

  @Column({
    name: 'EPS',
    type: 'varchar',
    length: 200,
    default: '',
  })
  eps: string;

  @Column({
    name: 'DIAGNOSTICO',
    type: 'text',
    default: '',
  })
  diagnostico: string;

  @Column({
    name: 'PRESTADOREXTERNO',
  })
  prestadorExterno: boolean;

  @Column({
    name: 'INSTITUCIONORIGEN',
    type: 'varchar',
    length: 200,
    default: '',
  })
  institucionOrigen: string;

  @Column({
    name: 'OBSERVACIONES',
    type: 'text',
    default: '',
  })
  observaciones: string;

  /**
   * Usuario autenticado que creó el registro.
   */
  @Column({
    name: 'USUARIOCREACIONID',
    type: 'bigint',
  })
  usuarioCreacionId: number;

  @Column({
    name: 'USUARIOCREACIONNOMBRE',
    type: 'varchar',
    length: 150,
    default: '',
  })
  usuarioCreacionNombre: string;

  @OneToMany(() => DetalleMuestraCupsOrm, detalle => detalle.registro, {
    cascade: ['insert'],
    eager: false,
  })
  cups: DetalleMuestraCupsOrm[];

  @CreateDateColumn({
    name: 'CREATEDAT',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'UPDATEDAT',
  })
  updatedAt: Date;
}
