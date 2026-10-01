import { GcmContextCode } from '@common/domain/types';

export type PrioridadReporte = 'NORMAL' | 'CRITICA' | 'ALTA';
export type PrioridadReporteCode = 1 | 2 | 3;
export type ReporteSolicitudPedidoRawRow = Record<string, unknown>;
export const DIAS_OBJETIVO_PEDIDO = 15;
export const DIAS_ENTRE_PEDIDOS = 7;

export interface ReferenciaPedidoConsumo {
  solicitudPedidoId: number;
  numeroSolicitud: string;
  cantidadPendiente: number;
  cantidadDespachadaReciente: number;
  ultimoDespacho: string | null;
}
export interface ProductoReporteSolicitudPedido {
  agrupamientoKey: string;
  codigoAgrupamiento: string;
  nombreAgrupamiento: string;
  codigoProducto: string;
  descripcionProducto: string;
  grupo: string;
  presentaciones: { productoId: number; codigo: string; descripcion: string }[];
  existenciaActual: number;
  cantidadConsumida15Dias: number;
  cantidadConsumida7Dias: number;
  consumoPromedioDiario: number;
  consumoDiarioReciente: number;
  promedioSemanal: number;
  tendencia: 'AUMENTO' | 'DISMINUCION' | 'ESTABLE' | 'SIN_CONSUMO';
  inventarioDias: number | null;
  existenciaProyectada7Dias: number;
  faltanteProyectado7Dias: number;
  diasObjetivo: number;
  existenciaObjetivo: number;
  debePedir: boolean;
  requiereRevisionManual: boolean;
  cantidadSugerida: number;
  prioridadCode: PrioridadReporteCode;
  prioridad: PrioridadReporte;
  ultimaFechaSuministro: string | null;
  ultimaCompra: string | null;
  referenciasPedidos: ReferenciaPedidoConsumo[];
}
export interface ReporteSolicitudPedidoResponse {
  contextCode: GcmContextCode;
  sedeId: number;
  periodo: { desde: string; hasta: string; fechaCorte: string; dias: number };
  diasEntrePedidos: number;
  productos: ProductoReporteSolicitudPedido[];
}
const numero = (valor: unknown): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  const n = Number(valor);
  if (!Number.isFinite(n)) throw new Error('El reporte contiene una cantidad invalida');
  return n;
};
const texto = (valor: unknown) => String(valor ?? '').trim();
const codigo = (valor: unknown) => texto(valor).toUpperCase();
const redondear = (valor: number) => Number(valor.toFixed(4));
const fecha = (valor: unknown): string | null => {
  if (!valor) return null;
  const date = valor instanceof Date ? valor : new Date(String(valor));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const ultima = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);
const desplazarFecha = (corte: string, dias: number): string => {
  const date = new Date(corte + 'T00:00:00Z');
  if (Number.isNaN(date.getTime())) throw new Error('Fecha de corte invalida');
  date.setUTCDate(date.getUTCDate() + dias);
  return date.toISOString().slice(0, 10);
};

export const calcularPrioridadReporte = (
  dias: number | null
): {
  prioridadCode: PrioridadReporteCode;
  prioridad: PrioridadReporte;
} =>
  dias !== null && dias <= 2
    ? { prioridadCode: 2, prioridad: 'CRITICA' }
    : dias !== null && dias <= 4
      ? { prioridadCode: 3, prioridad: 'ALTA' }
      : { prioridadCode: 1, prioridad: 'NORMAL' };

export const transformarReporteSolicitudPedido = (
  filas: ReporteSolicitudPedidoRawRow[],
  contextCode: GcmContextCode,
  sedeId: number,
  fechaCorte: string,
  referencias: ReporteSolicitudPedidoRawRow[] = []
): ReporteSolicitudPedidoResponse => {
  const grupos = new Map<string, ProductoReporteSolicitudPedido>();
  const grupoPorProducto = new Map<number, ProductoReporteSolicitudPedido>();
  for (const fila of filas) {
    const productoId = numero(fila.PRODUCTOID);
    // El SQL retorna una fila por producto, con consumo y stock ya agregados por sede.
    if (!productoId || grupoPorProducto.has(productoId)) {
      throw new Error('El reporte contiene un producto invalido o duplicado');
    }
    const key = fila.AGRUPAMIENTOID ? 'A:' + fila.AGRUPAMIENTOID : 'P:' + productoId;
    let p = grupos.get(key);
    if (!p) {
      const agrupamiento = codigo(fila.CODIGOAGRUPAMIENTO);
      const nombre = texto(fila.NOMBREAGRUPAMIENTO);
      p = {
        agrupamientoKey: key,
        codigoAgrupamiento: agrupamiento,
        nombreAgrupamiento: nombre,
        codigoProducto: agrupamiento || codigo(fila.CODIGOPRODUCTO),
        descripcionProducto: nombre || texto(fila.DESCRIPCIONPRODUCTO),
        grupo: texto(fila.GRUPO),
        presentaciones: [],
        existenciaActual: 0,
        cantidadConsumida15Dias: 0,
        cantidadConsumida7Dias: 0,
        consumoPromedioDiario: 0,
        consumoDiarioReciente: 0,
        promedioSemanal: 0,
        tendencia: 'SIN_CONSUMO',
        inventarioDias: null,
        existenciaProyectada7Dias: 0,
        faltanteProyectado7Dias: 0,
        diasObjetivo: DIAS_OBJETIVO_PEDIDO,
        existenciaObjetivo: 0,
        debePedir: false,
        requiereRevisionManual: false,
        cantidadSugerida: 0,
        prioridadCode: 1,
        prioridad: 'NORMAL',
        ultimaFechaSuministro: null,
        ultimaCompra: null,
        referenciasPedidos: [],
      };
      grupos.set(key, p);
    }
    grupoPorProducto.set(productoId, p);
    if (!numero(fila.BLOQUEADO)) {
      p.presentaciones.push({
        productoId,
        codigo: codigo(fila.CODIGOPRODUCTO),
        descripcion: texto(fila.DESCRIPCIONPRODUCTO),
      });
    }
    p.existenciaActual += numero(fila.EXISTENCIA_ACTUAL);
    p.cantidadConsumida15Dias += numero(fila.CANTIDAD_15_DIAS);
    p.cantidadConsumida7Dias += numero(fila.CANTIDAD_7_DIAS);
    p.ultimaFechaSuministro = ultima(p.ultimaFechaSuministro, fecha(fila.ULTIMA_FECHA_SUMINISTRO));
    p.ultimaCompra = ultima(p.ultimaCompra, fecha(fila.ULTIMA_COMPRA));
  }
  for (const fila of referencias) {
    const p = grupoPorProducto.get(numero(fila.PRODUCTOID));
    if (!p) continue;
    const pendiente = Math.max(0, numero(fila.PENDIENTE));
    const despachado = Math.max(0, numero(fila.DESPACHADORECIENTE));
    if (!pendiente && !despachado) continue;
    const id = numero(fila.SOLICITUDID);
    let ref = p.referenciasPedidos.find(r => r.solicitudPedidoId === id);
    if (!ref) {
      ref = {
        solicitudPedidoId: id,
        numeroSolicitud: texto(fila.NUMEROSOLICITUD),
        cantidadPendiente: 0,
        cantidadDespachadaReciente: 0,
        ultimoDespacho: null,
      };
      p.referenciasPedidos.push(ref);
    }
    ref.cantidadPendiente = redondear(ref.cantidadPendiente + pendiente);
    ref.cantidadDespachadaReciente = redondear(ref.cantidadDespachadaReciente + despachado);
    ref.ultimoDespacho = ultima(ref.ultimoDespacho, fecha(fila.ULTIMODESPACHO));
  }
  for (const p of grupos.values()) {
    const consumo15 = p.cantidadConsumida15Dias;
    const consumo7 = p.cantidadConsumida7Dias;
    const datosInvalidos =
      consumo15 < 0 || consumo7 < 0 || consumo7 > consumo15 || p.existenciaActual < 0;
    p.requiereRevisionManual = datosInvalidos || consumo15 === 0 || !p.presentaciones.length;
    const diario = Math.max(0, consumo15) / 15;
    const reciente = Math.max(0, consumo7) / 7;
    const cobertura = diario > 0 ? Math.max(0, p.existenciaActual) / diario : null;
    p.consumoPromedioDiario = redondear(diario);
    p.consumoDiarioReciente = redondear(reciente);
    p.promedioSemanal = redondear(diario * 7);
    p.inventarioDias = cobertura === null ? null : redondear(cobertura);
    // Comparación sin sumar ventanas solapadas ni elevar automáticamente el pedido.
    p.tendencia =
      consumo15 === 0
        ? 'SIN_CONSUMO'
        : consumo7 * 15 > consumo15 * 7
          ? 'AUMENTO'
          : consumo7 * 15 < consumo15 * 7
            ? 'DISMINUCION'
            : 'ESTABLE';
    p.existenciaProyectada7Dias = redondear(Math.max(0, p.existenciaActual - diario * 7));
    p.faltanteProyectado7Dias = redondear(Math.max(0, diario * 7 - p.existenciaActual));
    p.existenciaObjetivo = redondear(diario * DIAS_OBJETIVO_PEDIDO);
    // Despachos y pendientes se muestran aparte: no hay recepción confirmada.
    p.cantidadSugerida = p.requiereRevisionManual
      ? 0
      : redondear(Math.max(0, consumo15 - p.existenciaActual));
    p.debePedir = p.cantidadSugerida > 0;
    Object.assign(p, calcularPrioridadReporte(datosInvalidos ? null : cobertura));
    p.existenciaActual = redondear(p.existenciaActual);
    p.cantidadConsumida15Dias = redondear(consumo15);
    p.cantidadConsumida7Dias = redondear(consumo7);
  }
  return {
    contextCode,
    sedeId,
    periodo: {
      desde: desplazarFecha(fechaCorte, -15),
      hasta: desplazarFecha(fechaCorte, -1),
      fechaCorte,
      dias: 15,
    },
    diasEntrePedidos: DIAS_ENTRE_PEDIDOS,
    productos: [...grupos.values()].sort((a, b) =>
      a.codigoProducto.localeCompare(b.codigoProducto)
    ),
  };
};
