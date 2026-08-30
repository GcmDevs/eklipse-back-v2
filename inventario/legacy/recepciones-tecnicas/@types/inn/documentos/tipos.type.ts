import { CtmType } from '@common/domain/types';

export type TipoDocumentoCode =
  | -1
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
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25;

export class TipoDocumentoType extends CtmType<TipoDocumentoCode> {}

const MOVIMIENTO_CARDEX = new TipoDocumentoType(-1, 'MOVIMIENTO CARDEX');
const ORDEN_COMPRA = new TipoDocumentoType(0, 'ORDEN DE COMPRA');
const REMISION_ENTRADA = new TipoDocumentoType(1, 'REMISIÓN DE ENTRADA');
const COMPROBANTE_ENTRADA = new TipoDocumentoType(2, 'COMPROBANTE DE ENTRADA');
const SUMINISTRO_PACIENTE = new TipoDocumentoType(3, 'SUMINISTRO DE PACIENTE');
const INVENTARIO_INICIAL = new TipoDocumentoType(4, 'INVENTARIO INICIAL');
const DEVOLUCION_SUMINISTRO = new TipoDocumentoType(5, 'DEVOLUCIÓN DE SUMINISTRO');
const CIERRE_MENSUAL = new TipoDocumentoType(6, 'CIERRE MENSUAL');
const COTIZACION = new TipoDocumentoType(7, 'COTIZACIÓN');
const REMISION_SALIDA = new TipoDocumentoType(8, 'REMISIÓN DE SALIDA');
const PEDIDO = new TipoDocumentoType(9, 'PEDIDO');
const PRESTAMO_MERCANCIA = new TipoDocumentoType(10, 'PRESTAMO DE MERCANCÍA');
const AJUSTE_INVENTARIO = new TipoDocumentoType(11, 'AJUSTE DE INVENTARIO');
const FACTURA = new TipoDocumentoType(12, 'FACTURA');
const COMPROMISOS = new TipoDocumentoType(13, 'COMPROMISOS');
const DEVOLUCION_REMISION = new TipoDocumentoType(14, 'DEVOLUCIÓN DE REMISIÓN');
const DEVOLUCION_COMPRA = new TipoDocumentoType(15, 'DEVOLUCIÓN DE COMPRA');
const DEVOLUCION_VENTA = new TipoDocumentoType(16, 'DEVOLUCIÓN DE VENTA');
const ORDEN_DESPACHO = new TipoDocumentoType(17, 'ORDEN DE DESPACHO');
const CONTRATO = new TipoDocumentoType(18, 'CONTRATO');
const ORDEN_SERVICIO = new TipoDocumentoType(19, 'ORDEN DE SERVICIO');
const ORDEN_PRODUCCION = new TipoDocumentoType(20, 'ORDEN DE PRODUCCIÓN');
const DEVOLUCION_ORDEN_DESPACHO = new TipoDocumentoType(21, 'DEVOLUCIÓN ORDEN DE DESPACHO');
const SOLICITUD_PEDIDO = new TipoDocumentoType(22, 'SOLICITUD DE PEDIDO');
const DEMANDA_INSATISFECHA = new TipoDocumentoType(23, 'DEMANDA INSATISFECHA');
const TRASLADO_PRODUCTOS_CONSIGNACION = new TipoDocumentoType(
  24,
  'TRASLADO PRODUCTOS EN CONSIGNACIÓN'
);
const RECIBO_ORDEN_DESPACHO = new TipoDocumentoType(25, 'RECIBO ORDEN DE DESPACHO');

export function tipoDocumentoTypeFactory(code: TipoDocumentoCode): TipoDocumentoType {
  switch (code) {
    case -1:
      return MOVIMIENTO_CARDEX;
    case 0:
      return ORDEN_COMPRA;
    case 1:
      return REMISION_ENTRADA;
    case 2:
      return COMPROBANTE_ENTRADA;
    case 3:
      return SUMINISTRO_PACIENTE;
    case 4:
      return INVENTARIO_INICIAL;
    case 5:
      return DEVOLUCION_SUMINISTRO;
    case 6:
      return CIERRE_MENSUAL;
    case 7:
      return COTIZACION;
    case 8:
      return REMISION_SALIDA;
    case 9:
      return PEDIDO;
    case 10:
      return PRESTAMO_MERCANCIA;
    case 11:
      return AJUSTE_INVENTARIO;
    case 12:
      return FACTURA;
    case 13:
      return COMPROMISOS;
    case 14:
      return DEVOLUCION_REMISION;
    case 15:
      return DEVOLUCION_COMPRA;
    case 16:
      return DEVOLUCION_VENTA;
    case 17:
      return ORDEN_DESPACHO;
    case 18:
      return CONTRATO;
    case 19:
      return ORDEN_SERVICIO;
    case 20:
      return ORDEN_PRODUCCION;
    case 21:
      return DEVOLUCION_ORDEN_DESPACHO;
    case 22:
      return SOLICITUD_PEDIDO;
    case 23:
      return DEMANDA_INSATISFECHA;
    case 24:
      return TRASLADO_PRODUCTOS_CONSIGNACION;
    case 25:
      return RECIBO_ORDEN_DESPACHO;
  }
}

export const TIPOS_DOCUMENTO_VALUES = [
  MOVIMIENTO_CARDEX,
  ORDEN_COMPRA,
  REMISION_ENTRADA,
  COMPROBANTE_ENTRADA,
  SUMINISTRO_PACIENTE,
  INVENTARIO_INICIAL,
  DEVOLUCION_SUMINISTRO,
  CIERRE_MENSUAL,
  COTIZACION,
  REMISION_SALIDA,
  PEDIDO,
  PRESTAMO_MERCANCIA,
  AJUSTE_INVENTARIO,
  FACTURA,
  COMPROMISOS,
  DEVOLUCION_REMISION,
  DEVOLUCION_COMPRA,
  DEVOLUCION_VENTA,
  ORDEN_DESPACHO,
  CONTRATO,
  ORDEN_SERVICIO,
  ORDEN_PRODUCCION,
  DEVOLUCION_ORDEN_DESPACHO,
  SOLICITUD_PEDIDO,
  DEMANDA_INSATISFECHA,
  TRASLADO_PRODUCTOS_CONSIGNACION,
  RECIBO_ORDEN_DESPACHO,
];

export const TIPOS_DOCUMENTO = {
  MOVIMIENTO_CARDEX,
  ORDEN_COMPRA,
  REMISION_ENTRADA,
  COMPROBANTE_ENTRADA,
  SUMINISTRO_PACIENTE,
  INVENTARIO_INICIAL,
  DEVOLUCION_SUMINISTRO,
  CIERRE_MENSUAL,
  COTIZACION,
  REMISION_SALIDA,
  PEDIDO,
  PRESTAMO_MERCANCIA,
  AJUSTE_INVENTARIO,
  FACTURA,
  COMPROMISOS,
  DEVOLUCION_REMISION,
  DEVOLUCION_COMPRA,
  DEVOLUCION_VENTA,
  ORDEN_DESPACHO,
  CONTRATO,
  ORDEN_SERVICIO,
  ORDEN_PRODUCCION,
  DEVOLUCION_ORDEN_DESPACHO,
  SOLICITUD_PEDIDO,
  DEMANDA_INSATISFECHA,
  TRASLADO_PRODUCTOS_CONSIGNACION,
  RECIBO_ORDEN_DESPACHO,
};
