import { CatalogPriceOrm } from './catalog-price.orm';
import { ScheduleOrm } from './schedule.orm';
import { CatalogOrm } from './catalog.orm';
import { DimItdDietOrm } from './diet.orm';
import { DieCentroOrm } from './die-centro.orm';
import { DietaConfExtraOrm } from './die-conf-dieta-extra.orm';
import { DieEstadoOrm } from './die-estado.orm';
import { DieJornadaOrm } from './die-jornada.orm';
import { DieSubgrupoOrm } from './die-sub-grupo.orm';
import { TransactionDietaOrm } from './die-transaccion.orm';
import { UsuarioOrm } from './usuario.orm';
import { SubgrupoOrm } from './subgrupo.orm';
import { CentroOrm } from './centro.orm';
import { EstanciaOrm } from './estancia.orm';
import { IngresoOrm } from './ingreso.orm';
import { PacienteOrm } from './paciente.orm';
import { CamaOrm } from './cama.orm';

export * from './catalog-price.orm';
export * from './schedule.orm';
export * from './catalog.orm';
export * from './diet.orm';
export * from './die-centro.orm';
export * from './die-conf-dieta-extra.orm';
export * from './die-estado.orm';
export * from './die-jornada.orm';
export * from './die-sub-grupo.orm';
export * from './die-transaccion.orm';
export * from './usuario.orm';
export * from './subgrupo.orm';
export * from './centro.orm';
export * from './estancia.orm';
export * from './ingreso.orm';
export * from './paciente.orm';
export * from './cama.orm';

export const LGC_DIE_ENTITIES = [
  CamaOrm,
  CentroOrm,
  DieCentroOrm,
  DietaConfExtraOrm,
  DieEstadoOrm,
  DieJornadaOrm,
  DieSubgrupoOrm,
  TransactionDietaOrm,
  SubgrupoOrm,
  UsuarioOrm,
  EstanciaOrm,
  IngresoOrm,
  PacienteOrm,
  ScheduleOrm,
  CatalogOrm,
  CatalogPriceOrm,
  DimItdDietOrm,
];
