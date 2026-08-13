import { INN_MODULES } from './common';
import { CTC_AUTHS } from './_central-compras';
import { CTMZ_AUTHS } from './_central-mezclas';
import { COTIZACIONES_PREFABRICADAS_AUTHS } from './_cotizaciones-prefabricadas';
import { DOCUMENTOS_AUTHS } from './_documentos';
import { EQUIPOS_AUTHS } from './_equipos';
import { FARMACIA_AUTHS } from './_farmacia';
import { PRODUCTOS_AUTHS } from './_productos';
import { RECEPCION_TECNICA_AUTHS } from './_recepcion-tecnica';
import { SERVICIO_TECNICO_AUTHS } from './_servicio-tecnico';
import { SUMINISTROS_PACIENTE_AUTHS } from './_suministros-paciente';
import { SOLICITUD_PEDIDO_AUTHS } from './_solicitud-pedido';

export const INN_AUTHORITIES = {
  CODE: INN_MODULES.CODE,
  RECEPCION_TECNICA: RECEPCION_TECNICA_AUTHS,
  DOCUMENTOS: DOCUMENTOS_AUTHS,
  SUMINISTROS_PACIENTE: SUMINISTROS_PACIENTE_AUTHS,
  CENTRAL_COMPRAS: CTC_AUTHS,
  PRODUCTOS: PRODUCTOS_AUTHS,
  COTIZACIONES_PREFABRICADAS: COTIZACIONES_PREFABRICADAS_AUTHS,
  FARMACIA: FARMACIA_AUTHS,
  SERVICIO_TECNICO: SERVICIO_TECNICO_AUTHS,
  EQUIPOS: EQUIPOS_AUTHS,
  CENTRAL_MEZCLAS: CTMZ_AUTHS,
  SOLICITUD_PEDIDO: SOLICITUD_PEDIDO_AUTHS,
};
