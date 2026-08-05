import { CtmType } from "@common/domain/types";

export type EstadoEspecificoCode = 0|1|2|3|4|5|6|7|8|9|10|80|81|82|83|84|85|86|87|88|89|92|93|94|95|96|97|98;

export class EstadoEspecificoType extends CtmType<EstadoEspecificoCode> {}

const SOL_REGISTRADA = new EstadoEspecificoType(1, 'SOLICITUD REGISTRADA');
const SOL_APROBADA = new EstadoEspecificoType(2, 'SOLICITUD APROBADA');
const SOL_COTI_AGREGADA = new EstadoEspecificoType(3, 'COTIZACIÓN AGREGADA');
const COTI_OC_AGREGADA = new EstadoEspecificoType(4, 'ORDEN AGREGADA A COTIZACIÓN');
const COTI_OC_APROBADA = new EstadoEspecificoType(5, 'ORDEN APROBADA');
const COTI_OC_PROGRAMADA = new EstadoEspecificoType(6, 'ORDEN PROGRAMADA');
const COTI_OC_CONTABILIZADA = new EstadoEspecificoType(7, 'ORDEN CONTABILIZADA');
const COTI_OC_ABONO = new EstadoEspecificoType(8, 'ABONO ORDEN');
const COTI_OC_PAGO_FINAL = new EstadoEspecificoType(9, 'ULTIMO PAGO ORDEN');
const COTI_PRODUCTOS_RECIBIDOS = new EstadoEspecificoType(10, 'PRODUCTOS RECIBIDOS');
const SOL_GESTION_MANUAL = new EstadoEspecificoType(80, 'GESTIONADA MANUALMENTE');
const SOL_CANCELADA = new EstadoEspecificoType(81, 'CANCELADA POR MOTIVOS VARIOS');
const SOL_DECLI_JEF_DEPEND = new EstadoEspecificoType(82, 'DECLINADA POR JEFE DEPENDENCIA');
const SOL_REASIGNADA_OTRO_CENTRO = new EstadoEspecificoType(83, 'REASIGNADA A OTRO CENTRO');
const SOL_CAJA_MENOR_EXPRESS = new EstadoEspecificoType(84, 'CAJA MENOR EXPRESS');
const COTI_PRODUCTOS_NO_RECIBIDOS = new EstadoEspecificoType(85, 'PRODUCTOS NO RECIBIDOS');
const COTI_LISTA_PARA_ENTREGA = new EstadoEspecificoType(86, 'LISTA PARA ENTREGA');
const COTI_POR_APROBAR = new EstadoEspecificoType(87, 'COTIZACION(ES) POR APROBAR');
const COTI_APROBADAS = new EstadoEspecificoType(88, 'COTIZACION(ES) APROBADA(S)');
const SOL_REACTIVADA = new EstadoEspecificoType(89, 'SOLICITUD REACTIVADA');
const COTI_OC_NO_APROBADA = new EstadoEspecificoType(92, 'ORDEN NO APROBADA');
const COTI_OC_NO_PROGRAMADA = new EstadoEspecificoType(93, 'ORDEN NO PROGRAMADA');
const COTI_OC_NO_CONTABILIZADA = new EstadoEspecificoType(94, 'ORDEN NO CONTABILIZADA');
const COTI_OC_NO_PAGADA = new EstadoEspecificoType(95, 'ORDEN NO PAGADA');
const COTI_OC_NO_RECIBIDA = new EstadoEspecificoType(96, 'ORDEN NO RECIBIDA');
const SOL_NO_APROBADA = new EstadoEspecificoType(97, 'SOLICITUD NO APROBADA');
const COTI_NO_APROBADA = new EstadoEspecificoType(98, 'COTIZACION(ES) RECHAZADA(S)');

export function estadoEspecificoTypeFactory(code: EstadoEspecificoCode): EstadoEspecificoType {
  switch (code) {
    case 1: return SOL_REGISTRADA;
    case 2: return SOL_APROBADA;
    case 3: return SOL_COTI_AGREGADA;
    case 4: return COTI_OC_AGREGADA;
    case 5: return COTI_OC_APROBADA;
    case 6: return COTI_OC_PROGRAMADA;
    case 7: return COTI_OC_CONTABILIZADA;
    case 8: return COTI_OC_ABONO;
    case 9: return COTI_OC_PAGO_FINAL;
    case 10: return COTI_PRODUCTOS_RECIBIDOS;
    case 80: return SOL_GESTION_MANUAL;
    case 81: return SOL_CANCELADA;
    case 82: return SOL_DECLI_JEF_DEPEND;
    case 83: return SOL_REASIGNADA_OTRO_CENTRO;
    case 84: return SOL_CAJA_MENOR_EXPRESS;
    case 85: return COTI_PRODUCTOS_NO_RECIBIDOS;
    case 86: return COTI_LISTA_PARA_ENTREGA;
    case 87: return COTI_POR_APROBAR;
    case 88: return COTI_APROBADAS;
    case 89: return SOL_REACTIVADA;
    case 92: return COTI_OC_NO_APROBADA;
    case 93: return COTI_OC_NO_PROGRAMADA;
    case 94: return COTI_OC_NO_CONTABILIZADA;
    case 95: return COTI_OC_NO_PAGADA;
    case 96: return COTI_OC_NO_RECIBIDA;
    case 97: return SOL_NO_APROBADA;
    case 98: return COTI_NO_APROBADA;
  }
}

export const SOL_ESTADOS_ESPECIFICOS = {
  SOL_REGISTRADA,
  SOL_APROBADA,
  SOL_COTI_AGREGADA,
  COTI_POR_APROBAR,
  COTI_LISTA_PARA_ENTREGA,
  COTI_APROBADAS,
  COTI_OC_AGREGADA,
  COTI_OC_APROBADA,
  COTI_OC_PROGRAMADA,
  COTI_OC_CONTABILIZADA,
  COTI_OC_ABONO,
  COTI_OC_PAGO_FINAL,
  COTI_PRODUCTOS_RECIBIDOS,
  SOL_GESTION_MANUAL,
  SOL_CANCELADA,
  SOL_DECLI_JEF_DEPEND,
  SOL_REASIGNADA_OTRO_CENTRO,
  SOL_REACTIVADA,
  COTI_OC_NO_APROBADA,
  COTI_OC_NO_PROGRAMADA,
  SOL_CAJA_MENOR_EXPRESS,
  COTI_OC_NO_CONTABILIZADA,
  COTI_PRODUCTOS_NO_RECIBIDOS,
  COTI_OC_NO_PAGADA,
  COTI_OC_NO_RECIBIDA,
  SOL_NO_APROBADA,
  COTI_NO_APROBADA,
};

export const SOL_ESTADOS_ESPECIFICOS_VALUES = Object.values(SOL_ESTADOS_ESPECIFICOS);
