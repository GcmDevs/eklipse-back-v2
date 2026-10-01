import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'GCMGESCART' })
export class GestionCarteraEntity {
  @PrimaryGeneratedColumn({ name: 'OID', type: 'integer' })
  OID: number;

  @Column({ name: 'GENUSUARIO', type: 'integer' })
  GENUSUARIO: number;

  @CreateDateColumn({ name: 'FECHA', type: 'datetimeoffset' })
  FECHA: Date;

  @Column({ name: 'GENTERCER', type: 'integer' })
  GENTERCER: number;

  @Column({ name: 'TELEFTERC', type: 'nvarchar' })
  TELEFTERC: string;

  @Column({ name: 'RESPTERC', type: 'nvarchar' })
  RESPTERC: string;

  @Column({ name: 'MOTLLAMAD', type: 'nvarchar' })
  MOTLLAMAD: string;

  @Column({ name: 'OBSERVACION', type: 'text' })
  OBSERVACION: string;

  @CreateDateColumn({
    name: 'FECHCONCI',
    type: 'datetimeoffset',
  })
  FECHCONCI!: Date;

  @Column({ name: 'TIPCONCI', type: 'nvarchar', default: null })
  TIPCONCI: string;
}
