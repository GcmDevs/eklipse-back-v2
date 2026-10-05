import { TABLE_NAMES } from '@common/application/constants';

export const REFERENCIA_ENTIDAD = {
  AUDIT_TIPO_EQUIPO: `AUDIT_TIPO_EQUIPO::${TABLE_NAMES.inn.eqp.audit_tipo_equipo}`,
  SOLICITUD_APROBACION: `SOLICITUD_APROBACION::${TABLE_NAMES.inn.eqp.solicitudes}`,
  ACCESORIO_UNIDAD: `ACCESORIO_UNIDAD::${TABLE_NAMES.inn.eqp.eq_accesorios_unidad}`,
  PLAN_ACTIVIDAD: `PLAN_ACTIVIDAD::${TABLE_NAMES.inn.eqp.actividades.planes_actividades}`,
  BAJA: `BAJA::${TABLE_NAMES.inn.eqp.baja_equipo}`,
  COMPRA: `COMPRA::${TABLE_NAMES.inn.eqp.adquisiciones}`,
} as const;

export type ReferenciaEntidad = (typeof REFERENCIA_ENTIDAD)[keyof typeof REFERENCIA_ENTIDAD];
