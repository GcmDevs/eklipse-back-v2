import { CamaOrm } from './cama.orm';
import { DiagnosticoOrm } from './diagnostico.orm';
import { EgresoOrm } from './egreso.orm';
import { EspecialidadOrm } from './especialidad.orm';
import { EstanciaOrm } from './estancia.orm';
import { GrupoOrm } from './grupo.orm';
import { HpnIngresoOrm } from './hpn-ingreso.orm';
import { SubgrupoOrm } from './subgrupo.orm';
import { TipoCamaOrm } from './tipo-cama.orm';

export * from './cama.orm';
export * from './diagnostico.orm';
export * from './egreso.orm';
export * from './especialidad.orm';
export * from './estancia.orm';
export * from './grupo.orm';
export * from './hpn-ingreso.orm';
export * from './subgrupo.orm';
export * from './tipo-cama.orm';

export const LGC_TAS_TEMP_ENTITIES = [
  CamaOrm,
  DiagnosticoOrm,
  EgresoOrm,
  EspecialidadOrm,
  EstanciaOrm,
  GrupoOrm,
  HpnIngresoOrm,
  SubgrupoOrm,
  TipoCamaOrm,
];
