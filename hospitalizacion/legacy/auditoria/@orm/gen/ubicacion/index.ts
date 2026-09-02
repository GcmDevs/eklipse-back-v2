import { DepartamentoOrm } from './departamento.orm';
import { DireccionOrm } from './direccion.orm';
import { MunicipioOrm } from './municipio.orm';
import { PaisOrm } from './pais.orm';

export * from './departamento.orm';
export * from './direccion.orm';
export * from './municipio.orm';
export * from './pais.orm';

export const LGC_AUD_GEN_UBICACION_ENTITIES = [
  DepartamentoOrm,
  DireccionOrm,
  MunicipioOrm,
  PaisOrm,
];
