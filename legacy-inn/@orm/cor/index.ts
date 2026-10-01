import { AnexoOrm } from './anexo.orm';
import { ArchivoAlmacenadoOrm } from './archivo-almacenado.orm';
import { ConsecutivoOrm } from './consecutivo.orm';
import { FirmaOrm } from './firma.orm';
import { ResponsableView } from './responsable.view';
import { TerceroRolOrm } from './rol-tercero.orm';
import { TerceroOrm } from './tercero.orm';

export * from './archivo-almacenado.orm';
export * from './consecutivo.orm';
export * from './firma.orm';
export * from './rol-tercero.orm';
export * from './tercero.orm';
export * from './responsable.view';
export * from './anexo.orm';

export const ORM_COR_ENTITIES = [
  ArchivoAlmacenadoOrm,
  FirmaOrm,
  ResponsableView,
  ConsecutivoOrm,
  TerceroOrm,
  TerceroRolOrm,
  AnexoOrm,
];
