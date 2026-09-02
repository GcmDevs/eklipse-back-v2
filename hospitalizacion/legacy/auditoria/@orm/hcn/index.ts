import { FolioOrm } from './folio.orm';
import { TipoHistoriaOrm } from './tipo-historia.orm';

export * from './folio.orm';
export * from './tipo-historia.orm';

export const LGC_AUD_HCN_ENTITIES = [FolioOrm, TipoHistoriaOrm];
