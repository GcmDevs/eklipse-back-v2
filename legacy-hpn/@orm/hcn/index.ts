import { FolioOrm } from './folio.orm';
import { TipoHistoriaOrm } from './tipo-historia.orm';
import { DiagPacienteOrm } from './diag-paciente.orm';

export * from './folio.orm';
export * from './tipo-historia.orm';
export * from './diag-paciente.orm';

export const ORM_HCN_ENTITIES = [FolioOrm, TipoHistoriaOrm, DiagPacienteOrm];
