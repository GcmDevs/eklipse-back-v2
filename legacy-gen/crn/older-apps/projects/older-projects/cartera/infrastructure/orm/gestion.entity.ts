import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'GCMGESCART' })
export class GestionOrm {
  @PrimaryGeneratedColumn({ name: 'OID', type: 'integer' })
  id: number;

  @Column({ name: 'GENUSUARIO', type: 'integer' })
  createdBy: number;

  @CreateDateColumn({ name: 'FECHA', type: 'datetimeoffset' })
  createdAt: Date;

  @Column({ name: 'GENTERCER', type: 'integer' })
  idTercero: number;

  @Column({ name: 'TELEFTERC', type: 'nvarchar', length: 11 })
  telefonoTercero: string;

  /** Nombre completo representante del tercero. */
  @Column({ name: 'RESPTERC', type: 'nvarchar', length: 40 })
  nombreRepresentanteTercero: string;

  @Column({ name: 'MOTLLAMAD', type: 'nvarchar', length: 40 })
  motivoLlamada: string;

  @Column({ name: 'OBSERVACION', type: 'text' })
  observacion: string;

  @CreateDateColumn({
    name: 'FECHCONCI',
    type: 'datetimeoffset',
  })
  fechaConciliacion?: Date;

  @Column({ name: 'TIPCONCI', type: 'nvarchar', default: null, length: 20 })
  tipoConciliacion?: string;

  /*@CreateDateColumn({ name: 'DELETEAT', type: 'datetimeoffset', default: null })
  deleteAt?: Date;*/
}
