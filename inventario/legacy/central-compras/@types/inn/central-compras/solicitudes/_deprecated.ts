import { EstadoCode, EstadoType } from './estado/code';
import { EstadoEspecificoCode, EstadoEspecificoType } from './estado-especifico/code';

/**************************************************************************************************/
/*************************** ESTADOS ANTERIORES ***************************************************/
/**************************************************************************************************/
export type SolEstadoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 80 | 85 | 86 | 87 | 88 | 89 | 90 | 91;
const SOL_ELIMINADA = new EstadoType(0, 'ELIMINADA');
const SOL_REGISTRADA = new EstadoType(1, 'REGISTRADO');
const SOL_APROBADA = new EstadoType(2, 'APROBADO');
const SOL_EN_COTI = new EstadoType(3, 'EN COTIZACIÓN');
const COTI_POR_APROBAR = new EstadoType(4, 'COTIZACIÓN(ES) POR APROBAR');
const COTI_APROBADA = new EstadoType(5, 'COT. APROBADA(S) O RECHAZADA(S)');
const SOL_ULTIMOS_PASOS = new EstadoType(6, 'ULTIMOS PASOS');
const SOL_GESTION_MANUAL = new EstadoType(80, 'GESTIONADA MANUALMENTE');
const SOL_CANCELADA = new EstadoType(85, 'SOLICITUD CANCELADA');
const SOL_CARG_COLABORADOR = new EstadoType(86, 'CARGADA POR COLABORADOR');
const SOL_REASIGNADA_OTRO_CENTRO = new EstadoType(87, 'REASIGNADA A OTRO CENTRO');
const SOL_CAJA_MENOR_EXPRESS = new EstadoType(88, 'CAJA MENOR EXPRESS');
const SOL_REACTIVADA = new EstadoType(89, 'REACTIVADO');
const SOL_RECHAZO_TEMPORAL = new EstadoType(90, 'RECHAZADA TEMPORALMENTE');
const SOL_RECHAZO_DEFINITIVO = new EstadoType(91, 'RECHAZADA DEFINITIVAMENTE');
export function solEstadoTypeFactory(code: EstadoCode): EstadoType {
  switch (code) {
    case 0:
      return SOL_ELIMINADA;
    case 1:
      return SOL_REGISTRADA;
    case 2:
      return SOL_APROBADA;
    case 3:
      return SOL_EN_COTI;
    case 4:
      return COTI_POR_APROBAR;
    case 5:
      return COTI_APROBADA;
    case 6:
      return SOL_ULTIMOS_PASOS;
    case 80:
      return SOL_GESTION_MANUAL;
    case 85:
      return SOL_CANCELADA;
    case 86:
      return SOL_CARG_COLABORADOR;
    case 87:
      return SOL_REASIGNADA_OTRO_CENTRO;
    case 88:
      return SOL_CAJA_MENOR_EXPRESS;
    case 89:
      return SOL_REACTIVADA;
    case 90:
      return SOL_RECHAZO_TEMPORAL;
    case 91:
      return SOL_RECHAZO_DEFINITIVO;
  }
}
export const SOL_ESTADOS = {
  SOL_ELIMINADA,
  SOL_REGISTRADA,
  SOL_APROBADA,
  SOL_EN_COTI,
  COTI_POR_APROBAR,
  COTI_APROBADA,
  SOL_CAJA_MENOR_EXPRESS,
  SOL_ULTIMOS_PASOS,
  SOL_GESTION_MANUAL,
  SOL_CANCELADA,
  SOL_CARG_COLABORADOR,
  SOL_REASIGNADA_OTRO_CENTRO,
  SOL_REACTIVADA,
  SOL_RECHAZO_TEMPORAL,
  SOL_RECHAZO_DEFINITIVO,
};
export const SOL_ESTADOS_VALUES = [
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
];
/**************************************************************************************************/
/*************************** ESTADOS ESPECIFICOS ANTERIORES ***************************************/
/**************************************************************************************************/
export type SolEstadoEspecificoCode =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98;
const ESP_SOL_REGISTRADA = new EstadoEspecificoType(1, 'SOLICITUD REGISTRADA');
const ESP_SOL_APROBADA = new EstadoEspecificoType(2, 'SOLICITUD APROBADA');
const ESP_SOL_COTI_AGREGADA = new EstadoEspecificoType(3, 'COTIZACIÓN AGREGADA');
const ESP_COTI_OC_AGREGADA = new EstadoEspecificoType(4, 'ORDEN AGREGADA A COTIZACIÓN');
const ESP_COTI_OC_APROBADA = new EstadoEspecificoType(5, 'ORDEN APROBADA');
const ESP_COTI_OC_PROGRAMADA = new EstadoEspecificoType(6, 'ORDEN PROGRAMADA');
const ESP_COTI_OC_CONTABILIZADA = new EstadoEspecificoType(7, 'ORDEN CONTABILIZADA');
const ESP_COTI_OC_ABONO = new EstadoEspecificoType(8, 'ABONO ORDEN');
const ESP_COTI_OC_PAGO_FINAL = new EstadoEspecificoType(9, 'ULTIMO PAGO ORDEN');
const ESP_COTI_PRODUCTOS_RECIBIDOS = new EstadoEspecificoType(10, 'PRODUCTOS RECIBIDOS');
const ESP_SOL_GESTION_MANUAL = new EstadoEspecificoType(80, 'GESTIONADA MANUALMENTE');
const ESP_SOL_CANCELADA = new EstadoEspecificoType(81, 'CANCELADA POR MOTIVOS VARIOS');
const ESP_SOL_DECLI_JEF_DEPEND = new EstadoEspecificoType(82, 'DECLINADA POR JEFE DEPENDENCIA');
const ESP_SOL_REASIGNADA_OTRO_CENTRO = new EstadoEspecificoType(83, 'REASIGNADA A OTRO CENTRO');
const ESP_SOL_CAJA_MENOR_EXPRESS = new EstadoEspecificoType(84, 'CAJA MENOR EXPRESS');
const ESP_COTI_PRODUCTOS_NO_RECIBIDOS = new EstadoEspecificoType(85, 'PRODUCTOS NO RECIBIDOS');
const ESP_COTI_LISTA_PARA_ENTREGA = new EstadoEspecificoType(86, 'LISTA PARA ENTREGA');
const ESP_COTI_POR_APROBAR = new EstadoEspecificoType(87, 'COTIZACION(ES) POR APROBAR');
const ESP_COTI_APROBADAS = new EstadoEspecificoType(88, 'COTIZACION(ES) APROBADA(S)');
const ESP_SOL_REACTIVADA = new EstadoEspecificoType(89, 'SOLICITUD REACTIVADA');
const ESP_COTI_OC_NO_APROBADA = new EstadoEspecificoType(92, 'ORDEN NO APROBADA');
const ESP_COTI_OC_NO_PROGRAMADA = new EstadoEspecificoType(93, 'ORDEN NO PROGRAMADA');
const ESP_COTI_OC_NO_CONTABILIZADA = new EstadoEspecificoType(94, 'ORDEN NO CONTABILIZADA');
const ESP_COTI_OC_NO_PAGADA = new EstadoEspecificoType(95, 'ORDEN NO PAGADA');
const ESP_COTI_OC_NO_RECIBIDA = new EstadoEspecificoType(96, 'ORDEN NO RECIBIDA');
const ESP_SOL_NO_APROBADA = new EstadoEspecificoType(97, 'SOLICITUD NO APROBADA');
const ESP_COTI_NO_APROBADA = new EstadoEspecificoType(98, 'COTIZACION(ES) RECHAZADA(S)');
export function solEstadoEspecificoTypeFactory(code: EstadoEspecificoCode): EstadoEspecificoType {
  switch (code) {
    case 1:
      return ESP_SOL_REGISTRADA;
    case 2:
      return ESP_SOL_APROBADA;
    case 3:
      return ESP_SOL_COTI_AGREGADA;
    case 4:
      return ESP_COTI_OC_AGREGADA;
    case 5:
      return ESP_COTI_OC_APROBADA;
    case 6:
      return ESP_COTI_OC_PROGRAMADA;
    case 7:
      return ESP_COTI_OC_CONTABILIZADA;
    case 8:
      return ESP_COTI_OC_ABONO;
    case 9:
      return ESP_COTI_OC_PAGO_FINAL;
    case 10:
      return ESP_COTI_PRODUCTOS_RECIBIDOS;
    case 80:
      return ESP_SOL_GESTION_MANUAL;
    case 81:
      return ESP_SOL_CANCELADA;
    case 82:
      return ESP_SOL_DECLI_JEF_DEPEND;
    case 83:
      return ESP_SOL_REASIGNADA_OTRO_CENTRO;
    case 84:
      return ESP_SOL_CAJA_MENOR_EXPRESS;
    case 85:
      return ESP_COTI_PRODUCTOS_NO_RECIBIDOS;
    case 86:
      return ESP_COTI_LISTA_PARA_ENTREGA;
    case 87:
      return ESP_COTI_POR_APROBAR;
    case 88:
      return ESP_COTI_APROBADAS;
    case 89:
      return ESP_SOL_REACTIVADA;
    case 92:
      return ESP_COTI_OC_NO_APROBADA;
    case 93:
      return ESP_COTI_OC_NO_PROGRAMADA;
    case 94:
      return ESP_COTI_OC_NO_CONTABILIZADA;
    case 95:
      return ESP_COTI_OC_NO_PAGADA;
    case 96:
      return ESP_COTI_OC_NO_RECIBIDA;
    case 97:
      return ESP_SOL_NO_APROBADA;
    case 98:
      return ESP_COTI_NO_APROBADA;
  }
}
export const SOL_ESTADOS_ESPECIFICOS = {
  SOL_REGISTRADA: ESP_SOL_REGISTRADA,
  SOL_APROBADA: ESP_SOL_APROBADA,
  SOL_COTI_AGREGADA: ESP_SOL_COTI_AGREGADA,
  COTI_POR_APROBAR: ESP_COTI_POR_APROBAR,
  COTI_LISTA_PARA_ENTREGA: ESP_COTI_LISTA_PARA_ENTREGA,
  COTI_APROBADAS: ESP_COTI_APROBADAS,
  COTI_OC_AGREGADA: ESP_COTI_OC_AGREGADA,
  COTI_OC_APROBADA: ESP_COTI_OC_APROBADA,
  COTI_OC_PROGRAMADA: ESP_COTI_OC_PROGRAMADA,
  COTI_OC_CONTABILIZADA: ESP_COTI_OC_CONTABILIZADA,
  COTI_OC_ABONO: ESP_COTI_OC_ABONO,
  COTI_OC_PAGO_FINAL: ESP_COTI_OC_PAGO_FINAL,
  COTI_PRODUCTOS_RECIBIDOS: ESP_COTI_PRODUCTOS_RECIBIDOS,
  SOL_GESTION_MANUAL: ESP_SOL_GESTION_MANUAL,
  SOL_CANCELADA: ESP_SOL_CANCELADA,
  SOL_DECLI_JEF_DEPEND: ESP_SOL_DECLI_JEF_DEPEND,
  SOL_REASIGNADA_OTRO_CENTRO: ESP_SOL_REASIGNADA_OTRO_CENTRO,
  SOL_REACTIVADA: ESP_SOL_REACTIVADA,
  COTI_OC_NO_APROBADA: ESP_COTI_OC_NO_APROBADA,
  COTI_OC_NO_PROGRAMADA: ESP_COTI_OC_NO_PROGRAMADA,
  SOL_CAJA_MENOR_EXPRESS: ESP_SOL_CAJA_MENOR_EXPRESS,
  COTI_OC_NO_CONTABILIZADA: ESP_COTI_OC_NO_CONTABILIZADA,
  COTI_PRODUCTOS_NO_RECIBIDOS: ESP_COTI_PRODUCTOS_NO_RECIBIDOS,
  COTI_OC_NO_PAGADA: ESP_COTI_OC_NO_PAGADA,
  COTI_OC_NO_RECIBIDA: ESP_COTI_OC_NO_RECIBIDA,
  SOL_NO_APROBADA: ESP_SOL_NO_APROBADA,
  COTI_NO_APROBADA: ESP_COTI_NO_APROBADA,
};
export const SOL_ESTADOS_ESPECIFICOS_VALUES = [
  ESP_SOL_REGISTRADA,
  ESP_SOL_APROBADA,
  ESP_SOL_COTI_AGREGADA,
  ESP_COTI_POR_APROBAR,
  ESP_COTI_APROBADAS,
  ESP_COTI_OC_AGREGADA,
  ESP_COTI_OC_APROBADA,
  ESP_COTI_OC_PROGRAMADA,
  ESP_COTI_OC_CONTABILIZADA,
  ESP_COTI_OC_ABONO,
  ESP_COTI_LISTA_PARA_ENTREGA,
  ESP_COTI_OC_PAGO_FINAL,
  ESP_COTI_PRODUCTOS_RECIBIDOS,
  ESP_SOL_CANCELADA,
  ESP_SOL_DECLI_JEF_DEPEND,
  ESP_SOL_REASIGNADA_OTRO_CENTRO,
  ESP_SOL_REACTIVADA,
  ESP_COTI_PRODUCTOS_NO_RECIBIDOS,
  ESP_SOL_GESTION_MANUAL,
  ESP_SOL_CAJA_MENOR_EXPRESS,
  ESP_COTI_OC_NO_APROBADA,
  ESP_COTI_OC_NO_PROGRAMADA,
  ESP_COTI_OC_NO_CONTABILIZADA,
  ESP_COTI_OC_NO_PAGADA,
  ESP_COTI_OC_NO_RECIBIDA,
  ESP_SOL_NO_APROBADA,
  ESP_COTI_NO_APROBADA,
];
