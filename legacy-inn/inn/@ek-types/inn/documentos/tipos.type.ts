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

const movimientoKardex = new TipoDocumentoType(-1, 'MOVIMIENTO CARDEX');
const ordenCompra = new TipoDocumentoType(0, 'ORDEN DE COMPRA');
const remisionEntrada = new TipoDocumentoType(1, 'REMISIÓN DE ENTRADA');
const comprobanteEntrada = new TipoDocumentoType(2, 'COMPROBANTE DE ENTRADA');
const suministroPaciente = new TipoDocumentoType(3, 'SUMINISTRO DE PACIENTE');
const inventarioInicial = new TipoDocumentoType(4, 'INVENTARIO INICIAL');
const devolucionSuministro = new TipoDocumentoType(5, 'DEVOLUCIÓN DE SUMINISTRO');
const cierreMensual = new TipoDocumentoType(6, 'CIERRE MENSUAL');
const cotizacion = new TipoDocumentoType(7, 'COTIZACIÓN');
const remisionSalida = new TipoDocumentoType(8, 'REMISIÓN DE SALIDA');
const pedido = new TipoDocumentoType(9, 'PEDIDO');
const prestamoMercancia = new TipoDocumentoType(10, 'PRESTAMO DE MERCANCÍA');
const ajusteInventario = new TipoDocumentoType(11, 'AJUSTE DE INVENTARIO');
const factura = new TipoDocumentoType(12, 'FACTURA');
const compromisos = new TipoDocumentoType(13, 'COMPROMISOS');
const devolucionRemision = new TipoDocumentoType(14, 'DEVOLUCIÓN DE REMISIÓN');
const devolucionCompra = new TipoDocumentoType(15, 'DEVOLUCIÓN DE COMPRA');
const devolucionVenta = new TipoDocumentoType(16, 'DEVOLUCIÓN DE VENTA');
const ordenDespacho = new TipoDocumentoType(17, 'ORDEN DE DESPACHO');
const contrato = new TipoDocumentoType(18, 'CONTRATO');
const ordenServicio = new TipoDocumentoType(19, 'ORDEN DE SERVICIO');
const ordenProduccion = new TipoDocumentoType(20, 'ORDEN DE PRODUCCIÓN');
const devolucionOrdenDespacho = new TipoDocumentoType(21, 'DEVOLUCIÓN ORDEN DE DESPACHO');
const solicitudPedido = new TipoDocumentoType(22, 'SOLICITUD DE PEDIDO');
const demandaInsatisfecha = new TipoDocumentoType(23, 'DEMANDA INSATISFECHA');
const transladoProductoConsignacion = new TipoDocumentoType(
  24,
  'TRANSLADO PRODUCTOS EN CONSIGNACIÓN'
);
const reciboOrdenDespacho = new TipoDocumentoType(25, 'RECIBO ORDEN DE DESPACHO');

export function tipoDocumentoTypeFactory(code: TipoDocumentoCode): TipoDocumentoType {
  switch (code) {
    case -1:
      return movimientoKardex;
    case 0:
      return ordenCompra;
    case 1:
      return remisionEntrada;
    case 2:
      return comprobanteEntrada;
    case 3:
      return suministroPaciente;
    case 4:
      return inventarioInicial;
    case 5:
      return devolucionSuministro;
    case 6:
      return cierreMensual;
    case 7:
      return cotizacion;
    case 8:
      return remisionSalida;
    case 9:
      return pedido;
    case 10:
      return prestamoMercancia;
    case 11:
      return ajusteInventario;
    case 12:
      return factura;
    case 13:
      return compromisos;
    case 14:
      return devolucionRemision;
    case 15:
      return devolucionCompra;
    case 16:
      return devolucionVenta;
    case 17:
      return ordenDespacho;
    case 18:
      return contrato;
    case 19:
      return ordenServicio;
    case 20:
      return ordenProduccion;
    case 21:
      return devolucionOrdenDespacho;
    case 22:
      return solicitudPedido;
    case 23:
      return demandaInsatisfecha;
    case 24:
      return transladoProductoConsignacion;
    case 25:
      return reciboOrdenDespacho;
  }
}

export const TIPOS_DOCUMENTO_VALUES = [
  movimientoKardex,
  ordenCompra,
  remisionEntrada,
  comprobanteEntrada,
  suministroPaciente,
  inventarioInicial,
  devolucionSuministro,
  cierreMensual,
  cotizacion,
  remisionSalida,
  pedido,
  prestamoMercancia,
  ajusteInventario,
  factura,
  compromisos,
  devolucionRemision,
  devolucionCompra,
  devolucionVenta,
  ordenDespacho,
  contrato,
  ordenServicio,
  ordenProduccion,
  devolucionOrdenDespacho,
  solicitudPedido,
  demandaInsatisfecha,
  transladoProductoConsignacion,
  reciboOrdenDespacho,
];

export const TIPOS_DOCUMENTO = {
  movimientoKardex,
  ordenCompra,
  remisionEntrada,
  comprobanteEntrada,
  suministroPaciente,
  inventarioInicial,
  devolucionSuministro,
  cierreMensual,
  cotizacion,
  remisionSalida,
  pedido,
  prestamoMercancia,
  ajusteInventario,
  factura,
  compromisos,
  devolucionRemision,
  devolucionCompra,
  devolucionVenta,
  ordenDespacho,
  contrato,
  ordenServicio,
  ordenProduccion,
  devolucionOrdenDespacho,
  solicitudPedido,
  demandaInsatisfecha,
  transladoProductoConsignacion,
  reciboOrdenDespacho,
};
