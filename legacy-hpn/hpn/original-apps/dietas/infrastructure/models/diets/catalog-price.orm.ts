import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DIE_ENT_NAMES } from './_entity-names';
import { CatalogOrm } from './catalog.orm';

@Entity(DIE_ENT_NAMES.catalogPrice)
export class CatalogPriceOrm {
  @PrimaryGeneratedColumn({ name: 'OID', type: 'int' })
  id: number;

  @Column({ name: 'VALOR', type: 'decimal', precision: 7, scale: 2 })
  value: number;

  @Column({ name: 'FECHAREG' })
  createdAt: Date;

  @ManyToOne(() => CatalogOrm, catalog => catalog.price)
  @JoinColumn({ name: DIE_ENT_NAMES.catalog })
  catalog: CatalogOrm;

  @Column({ name: DIE_ENT_NAMES.catalog, nullable: true })
  catalogId: number;
}
