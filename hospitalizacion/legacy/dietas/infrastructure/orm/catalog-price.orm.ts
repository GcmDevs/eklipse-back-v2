import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CatalogOrm } from './catalog.orm';

@Entity('PDYDIECATPREC')
export class CatalogPriceOrm {
  @PrimaryGeneratedColumn({ name: 'OID', type: 'int' })
  id: number;

  @Column({ name: 'VALOR', type: 'decimal', precision: 7, scale: 2 })
  value: number;

  @Column({ name: 'FECHAREG' })
  createdAt: Date;

  @ManyToOne(() => CatalogOrm, catalog => catalog.price)
  @JoinColumn({ name: 'PDYDIECATALOG' })
  catalog: CatalogOrm;

  @Column({ name: 'PDYDIECATALOG', nullable: true })
  catalogId: number;
}
