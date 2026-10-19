import { SRDCentroOrm } from './centro.orm';
import { DepartamentoOrm } from './departamento.orm';
import { MunicipioOrm } from './municipio.orm';
import { PaisOrm } from './pais.orm';
import { SRDRCTSugerenciaOrm } from './rct-sugerencia.orm';

export * from './centro.orm';
export * from './pais.orm';
export * from './rct-sugerencia.orm';
export * from './municipio.orm';
export * from './departamento.orm';

export const ORM_SHARED_ENTITIES = [
  SRDCentroOrm,
  SRDRCTSugerenciaOrm,
  PaisOrm,
  MunicipioOrm,
  DepartamentoOrm,
];
