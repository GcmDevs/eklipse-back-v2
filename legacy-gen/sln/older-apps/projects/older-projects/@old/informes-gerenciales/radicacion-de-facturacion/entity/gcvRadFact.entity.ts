import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('GCVRADFACTUR')
export class GcvRadFac {
  @PrimaryColumn({ name: 'SLNFACTUR' })
  SLNFACTUR: number;

  @Column({ name: 'SFANUMFAC' })
  SFANUMFAC: string;

  @Column({ name: 'SFATIPDOC' })
  SFATIPDOC: number;

  @Column({ name: 'SFAFECFAC' })
  SFAFECFAC: Date;

  @Column({ name: 'SFATOTFAC' })
  SFATOTFAC: number;

  @Column({ name: 'SFAVALREC' })
  SFAVALREC: number;

  @Column({ name: 'SFADOCANU' })
  SFADOCANU: number;

  @Column({ name: 'SFAFECANU' })
  SFAFECANU: Date;

  @Column({ name: 'GENDETCON' })
  GENDETCON: number;

  @Column({ name: 'GDECODIGO' })
  GDECODIGO: string;

  @Column({ name: 'GDENOMBRE' })
  GDENOMBRE: string;

  @Column({ name: 'GENTERCER' })
  GENTERCER: number;

  @Column({ name: 'GTRNOMBRE' })
  GTRNOMBRE: string;

  @Column({ name: 'ADNINGRESO' })
  ADNINGRESO: number;

  @Column({ name: 'AINCONSEC' })
  AINCONSEC: number;

  @Column({ name: 'AINFECING' })
  AINFECING: Date;

  @Column({ name: 'ADNCENATE' })
  ADNCENATE: number;

  @Column({ name: 'ACANOMBRE' })
  ACANOMBRE: string;

  @Column({ name: 'CRNRADFACC' })
  CRNRADFACC: number;

  @Column({ name: 'CRFCONRAD' })
  CRFCONRAD: number;

  @Column({ name: 'CRFFECRAD' })
  CRFFECRAD: Date;

  @Column({ name: 'CRDVALRAD' })
  CRDVALRAD: number;

  @Column({ name: 'GENUSUACON' })
  GENUSUACON: number;

  @Column({ name: 'USUNOMCON' })
  USUNOMCON: string;

  @Column({ name: 'USUDESCON' })
  USUDESCON: string;

  @Column({ name: 'GENUSUAENT' })
  GENUSUAENT: number;

  @Column({ name: 'USUNOMENT' })
  USUNOMENT: string;

  @Column({ name: 'USUDESENT' })
  USUDESENT: string;

  @Column({ name: 'CRFESTADO' })
  CRFESTADO: number;
}
