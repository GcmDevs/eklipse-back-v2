import { CensoEstanciaProlongadaOrm } from './censo-estancia-prolongada.orm';
import { DominioAccionesOrm } from './domain-action.orm';
import { DominioAccionNotificacionOrm } from './domain-action-notification.orm';
import { DominioItemOrm } from './domain-item.orm';
import { DominioOrm } from './domain.orm';
import { GestorEstanciaProlongadaUsuarioOrm } from './gestor-estancia-prolongada-usuario.orm';
import { ProlongadaEstanciaOrm } from './prolonged-stay.orm';
import { SeguimientoSemanaOrm } from './seguimiento-semana.orm';
import { EstanciaItemPreguntasOrm } from './stay-item-answer.orm';

export * from './censo-estancia-prolongada.orm';
export * from './domain-action.orm';
export * from './domain-action-notification.orm';
export * from './domain-item.orm';
export * from './domain.orm';
export * from './gestor-estancia-prolongada-usuario.orm';
export * from './prolonged-stay.orm';
export * from './seguimiento-semana.orm';
export * from './stay-item-answer.orm';

export const ESTANCIASPROLONGADAS_ENTITIES = [
  CensoEstanciaProlongadaOrm,
  DominioAccionesOrm,
  DominioAccionNotificacionOrm,
  DominioItemOrm,
  DominioOrm,
  GestorEstanciaProlongadaUsuarioOrm,
  ProlongadaEstanciaOrm,
  SeguimientoSemanaOrm,
  EstanciaItemPreguntasOrm,
];
