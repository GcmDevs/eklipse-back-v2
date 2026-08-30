import { SRDCentroOrm } from './centro.orm';
import { SRDRCTSugerenciaOrm } from './rct-sugerencia.orm';

export * from './centro.orm';
export * from './rct-sugerencia.orm';

export const LGC_RCT_SHARED_ENTITIES = [SRDCentroOrm, SRDRCTSugerenciaOrm];
