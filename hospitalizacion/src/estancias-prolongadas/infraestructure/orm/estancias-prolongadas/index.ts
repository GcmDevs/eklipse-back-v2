import { CensoEstanciaProlongadaOrm } from './censo.orm';
import { DominioAccionNotificacionOrm } from './dominio-acciones.notificacion.orm';
import { DominioAccionesOrm } from './dominio-acciones.orm';
import { DominioItemOrm } from './dominio-item';
import { DominioOrm } from './dominio.orm';
import { EstanciaItemPreguntasOrm } from './estancia-item-preguntas.orm';
import { GestorEstanciaProlongadaUsuarioOrm } from './estancia-prolongada-usuario.orm';
import { EstanciasProlongadasOrm } from './estancia-prolongada.orm';
import { SeguimientoSemanaOrm } from './seguimiento-semana.orm';

export * from './censo.orm';
export * from './dominio-acciones.orm';
export * from './dominio-item';
export * from './dominio.orm';
export * from './estancia-prolongada.orm';
export * from './estancia-item-preguntas.orm';
export * from './seguimiento-semana.orm';
export * from './dominio-acciones.notificacion.orm';
export * from './estancia-prolongada-usuario.orm';

export const ESTANCIASPROLONGADAS_ENTITIES = [
  CensoEstanciaProlongadaOrm,
  DominioAccionesOrm,
  DominioAccionNotificacionOrm,
  DominioItemOrm,
  DominioOrm,
  GestorEstanciaProlongadaUsuarioOrm,
  EstanciasProlongadasOrm,
  SeguimientoSemanaOrm,
  EstanciaItemPreguntasOrm,
];
