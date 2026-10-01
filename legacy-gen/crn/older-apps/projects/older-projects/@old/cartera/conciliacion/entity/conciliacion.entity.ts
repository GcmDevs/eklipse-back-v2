import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'GCMCONCCART' })
export class ConciliacionCarteraEntity {
  @PrimaryGeneratedColumn({ name: 'OID', type: 'integer' })
  OID: number;

  @Column({ name: 'NACTACONCI', type: 'nvarchar', default: '000' })
  NACTACONCI!: string;

  @Column({ name: 'GCMGESCART', type: 'integer' })
  GCMGESCART: number;

  @Column({ name: 'FECHACONC', type: 'datetime' })
  FECHACONC: Date;

  @Column({ name: 'VALCONCI', type: 'decimal', default: 0 })
  VALCONCI!: number;

  @Column({ name: 'VALRECPAG', type: 'decimal', default: 0 })
  VALRECPAG!: number;

  @Column({ name: 'VALGLOSAD', type: 'decimal', default: 0 })
  VALGLOSAD!: number;

  @Column({ name: 'VALDEVUEL', type: 'decimal', default: 0 })
  VALDEVUEL!: number;

  @Column({ name: 'VALNORADI', type: 'decimal', default: 0 })
  VALNORADI!: number;

  @Column({ name: 'AUDITORIA', type: 'decimal', default: 0 })
  AUDITORIA!: number;

  @Column({ name: 'RETENCION', type: 'decimal', default: 0 })
  RETENCION!: number;

  @Column({ name: 'GLOSACEPTIPS', type: 'decimal', default: 0 })
  GLOSACEPTIPS!: number;

  @Column({ name: 'NOTNODESCEPS', type: 'decimal', default: 0 })
  NOTNODESCEPS!: number;

  @Column({ name: 'PAGNOAPLI', type: 'decimal', default: 0 })
  PAGNOAPLI!: number;

  @Column({ name: 'COPCUOMODE', type: 'decimal', default: 0 })
  COPCUOMODE!: number;

  @Column({ name: 'VALCANCEL', type: 'decimal', default: 0 })
  VALCANCEL!: number;

  @Column({ name: 'TOTAL', type: 'decimal', default: 0 })
  TOTAL!: number;

  @Column({ name: 'DIFEREN', type: 'decimal', default: 0 })
  DIFEREN!: number;

  @Column({ name: 'RUTARCHI', type: 'nvarchar', default: null })
  RUTARCHI!: string;

  @Column({ name: 'ESTADO', type: 'nvarchar', default: 'PENDIENTE' })
  ESTADO!: string;
}
