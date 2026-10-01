import { SSTItemOrm } from './item.orm';
import { SSTNotaOrm } from './nota.orm';
import { SolicitudServicioTecnicoOrm } from './solicitud-servicio-tecnico.orm';
import { UsuarioTipoServicioTecnicoOrm } from './usuario.tipo-servicio-tecnico.orm';

export * from './item.orm';
export * from './nota.orm';
export * from './solicitud-servicio-tecnico.orm';
export * from './usuario.tipo-servicio-tecnico.orm';

export const ORM_AFN_SVT_ENTITIES = [
  SSTItemOrm,
  SSTNotaOrm,
  SolicitudServicioTecnicoOrm,
  UsuarioTipoServicioTecnicoOrm,
];
