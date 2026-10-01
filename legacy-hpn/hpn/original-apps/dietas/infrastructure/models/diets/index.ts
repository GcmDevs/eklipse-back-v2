import { CatalogPriceOrm } from './catalog-price.orm';
import { ScheduleOrm } from './schedule.orm';
import { CatalogOrm } from './catalog.orm';
import { DimItdDietOrm } from './diet.orm';

export * from './catalog-price.orm';
export * from './schedule.orm';
export * from './catalog.orm';
export * from './diet.orm';

export const ORM_DIE_ENTITIES = [ScheduleOrm, CatalogOrm, CatalogPriceOrm, DimItdDietOrm];
