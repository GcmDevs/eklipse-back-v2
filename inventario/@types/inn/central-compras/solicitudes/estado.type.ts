import { CtmType } from "@common/domain/types";

export type EstadoCode = 0|1|2|3|4|5|6|80|85|86|87|88|89|90|91;

export class EstadoType extends CtmType<EstadoCode> {}

const SOL_ELIMINADA = new EstadoType(0, 'Solicitud eliminada');
const SOL_REGISTRADA = new EstadoType(1, 'Solicitud registrada');
const SOL_APROBADA = new EstadoType(2, 'Solicitud aprobada');
const SOL_EN_COTI = new EstadoType(3, 'Solicitud en cotización');
const COTI_POR_APROBAR = new EstadoType(4, 'Cotización(es) por aprobar');
const COTI_APROBADA = new EstadoType(5, 'Cotizacion(es) aprobada(s) o rechazada(s)');
const SOL_ULTIMOS_PASOS = new EstadoType(6, 'Ultimos pasos');
const SOL_GESTION_MANUAL = new EstadoType(80, 'Gestionada manualmente');
const SOL_CANCELADA = new EstadoType(85, 'Solicitud cancelada');
const SOL_CARG_COLABORADOR = new EstadoType(86, 'Solicitud cargada por colaborador');
const SOL_REASIGNADA_OTRO_CENTRO = new EstadoType(87, 'Solicitud reasignada a otro centro');
const SOL_CAJA_MENOR_EXPRESS = new EstadoType(88, 'Solicitud gestionada por caja menor express');
const SOL_REACTIVADA = new EstadoType(89, 'Solicitud reactivada');
const SOL_RECHAZO_TEMPORAL = new EstadoType(90, 'Solicitud rechazada temporalmente');
const SOL_RECHAZO_DEFINITIVO = new EstadoType(91, 'Solicitud rechazada definitivamente');

export function estadoTypeFactory(code: EstadoCode): EstadoType {
  switch (code) {
    case 0: return SOL_ELIMINADA;
    case 1: return SOL_REGISTRADA;
    case 2: return SOL_APROBADA;
    case 3: return SOL_EN_COTI;
    case 4: return COTI_POR_APROBAR;
    case 5: return COTI_APROBADA;
    case 6: return SOL_ULTIMOS_PASOS;
    case 80: return SOL_GESTION_MANUAL;
    case 85: return SOL_CANCELADA;
    case 86: return SOL_CARG_COLABORADOR;
    case 87: return SOL_REASIGNADA_OTRO_CENTRO;
    case 88: return SOL_CAJA_MENOR_EXPRESS;
    case 89: return SOL_REACTIVADA;
    case 90: return SOL_RECHAZO_TEMPORAL;
    case 91: return SOL_RECHAZO_DEFINITIVO;
  }
}

export const SOL_ESTADOS = {
  SOL_ELIMINADA,
  SOL_REGISTRADA,
  SOL_APROBADA,
  SOL_EN_COTI,
  COTI_POR_APROBAR,
  COTI_APROBADA,
  SOL_ULTIMOS_PASOS,
  SOL_GESTION_MANUAL,
  SOL_CANCELADA,
  SOL_CARG_COLABORADOR,
  SOL_REASIGNADA_OTRO_CENTRO,
  SOL_CAJA_MENOR_EXPRESS,
  SOL_REACTIVADA,
  SOL_RECHAZO_TEMPORAL,
  SOL_RECHAZO_DEFINITIVO,
};

export const SOL_ESTADOS_VALUES = Object.values(SOL_ESTADOS);


export const SOLICITUDES_RECHAZADAS_ESTADOS_CODES = [
  SOL_REASIGNADA_OTRO_CENTRO.getCode(),
  SOL_CANCELADA.getCode(),
  SOL_RECHAZO_TEMPORAL.getCode(),
  SOL_RECHAZO_DEFINITIVO.getCode(),
  SOL_GESTION_MANUAL.getCode(),
];