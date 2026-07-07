import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SolicitudOrm } from './solicitud.orm';
import { ViaCode } from '@inn/types/inn/central-mezclas';

@Entity('EKINNCTMZNUTPAR')
export class NutricionParenteralOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKINNCTMZSOLI' })
  solicitudId: number;

  @OneToOne(() => SolicitudOrm, solicitud => solicitud.nutricionParenteral)
  @JoinColumn({ name: 'EKINNCTMZSOLI', referencedColumnName: 'id' })
  solicitud: SolicitudOrm;

  @Column({ name: 'AA_10PERC', type: 'decimal', precision: 9, scale: 2, nullable: true })
  aa10Perc: number;

  @Column({ name: 'AA_15PERC', type: 'decimal', precision: 9, scale: 2, nullable: true })
  aa15Perc: number;

  @Column({ name: 'AA_PED', type: 'decimal', precision: 9, scale: 2, nullable: true })
  aaPed: number;

  @Column({ name: 'GLUTAMINA', type: 'decimal', precision: 9, scale: 2, nullable: true })
  glutamina: number;

  @Column({ name: 'PO4', type: 'decimal', precision: 9, scale: 2, nullable: true })
  po4: number;

  @Column({ name: 'DAD_50PERC', type: 'decimal', precision: 9, scale: 2, nullable: true })
  dad50Perc: number;

  @Column({ name: 'DAD_10PERC', type: 'decimal', precision: 9, scale: 2, nullable: true })
  dad10Perc: number;

  @Column({ name: 'TABPERIO_K', type: 'decimal', precision: 9, scale: 2, nullable: true })
  tabperioK: number;

  @Column({ name: 'TABPERIO_NA', type: 'decimal', precision: 9, scale: 2, nullable: true })
  tabperioNa: number;

  @Column({ name: 'TABPERIO_CA', type: 'decimal', precision: 9, scale: 2, nullable: true })
  tabperioCa: number;

  @Column({ name: 'TABPERIO_MG', type: 'decimal', precision: 9, scale: 2, nullable: true })
  tabperioMg: number;

  @Column({ name: 'ET_PED', type: 'decimal', precision: 9, scale: 2, nullable: true })
  etPed: number;

  @Column({ name: 'ET_ADU', type: 'decimal', precision: 9, scale: 2, nullable: true })
  etAdu: number;

  @Column({ name: 'VHID', type: 'decimal', precision: 9, scale: 2, nullable: true })
  vhid: number;

  @Column({ name: 'VIP_PED', type: 'decimal', precision: 9, scale: 2, nullable: true })
  vipPed: number;

  @Column({ name: 'VIP_ADU', type: 'decimal', precision: 9, scale: 2, nullable: true })
  vipAdu: number;

  @Column({ name: 'AGUA', type: 'decimal', precision: 9, scale: 2, nullable: true })
  agua: number;

  @Column({ name: 'LIP_20PERC', type: 'decimal', precision: 9, scale: 2, nullable: true })
  lip20Perc: number;

  @Column({ name: 'PES_AJUST', type: 'decimal', precision: 9, scale: 2, nullable: true })
  pesAjust: number;

  @Column({ name: 'VIA', type: 'decimal', precision: 9, scale: 2, nullable: true })
  viaCode: ViaCode;
}
