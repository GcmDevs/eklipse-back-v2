import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import {
  CatalogDietCode,
  CatalogDietType,
  catalogDietTypeFactory,
} from '@hpn/ori/die/domain/types/diets';
import { CatalogPriceOrm } from './catalog-price.orm';
import { ScheduleOrm } from './schedule.orm';
import { DIE_ENT_NAMES } from './_entity-names';
import { CentroOrm } from '../local';

@Entity(DIE_ENT_NAMES.catalog)
export class CatalogOrm {
  @PrimaryGeneratedColumn({ name: 'OID', type: 'int' })
  id: number;

  @Column({ name: 'CATTIPO', type: 'smallint' })
  typeCode: CatalogDietCode;

  type: CatalogDietType;

  @Column({ name: 'CATORDEN', type: 'smallint' })
  order: number;

  @Column({ name: 'CATCODIGO', length: 4 })
  code: string;

  @Column({ name: 'CATNOMBRE', length: 30 })
  name: string;

  @Column({ name: 'CATEGORY', length: 30, nullable: true })
  category: string;

  @Column({ name: 'CATINFOADI', length: 300, nullable: true })
  additionalInformation: string;

  @ManyToOne(() => CatalogPriceOrm, price => price.catalog)
  @JoinColumn({ name: DIE_ENT_NAMES.catalogPrice })
  price: CatalogPriceOrm;

  @Column({ name: DIE_ENT_NAMES.catalogPrice, nullable: true })
  priceId: number;

  @Column({ name: 'CATACTIVO', default: true })
  isActive: boolean;

  @ManyToOne(() => CentroOrm, client => client.catalogs)
  @JoinColumn({ name: DIE_ENT_NAMES.client })
  client: CentroOrm;

  @Column({ name: DIE_ENT_NAMES.client })
  clientId: number;

  @ManyToOne(() => ScheduleOrm, schedule => schedule.catalogs)
  @JoinColumn({ name: DIE_ENT_NAMES.schedule })
  schedule: ScheduleOrm;

  @Column({ name: DIE_ENT_NAMES.schedule, nullable: true })
  scheduleId: number;

  tipo: string;
  consistencia: string;

  setTypes(removeTypeCodes?: boolean) {
    this.type = catalogDietTypeFactory(this.typeCode);

    if (removeTypeCodes) {
      delete this.typeCode;
    }
  }
}
