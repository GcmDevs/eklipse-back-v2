import { GcmContextCode } from '@common/domain/types';

export const REPORTE_MESES = [
  { anio: 2026, mes: 5 },
  { anio: 2026, mes: 6 },
  { anio: 2026, mes: 7 },
] as const;

export type PrioridadReporte = 'NORMAL' | 'CRITICA' | 'ALTA';
export type PrioridadReporteCode = 1 | 2 | 3;

export interface MovimientoMensualReporte {
  anio: number;
  mes: number;
  entrada: number;
  salidaSinFormula: number;
  salidaCorregida: number;
  despachoConsumo: number;
  salidaFV: number;
}

export interface ProductoReporteSolicitudPedido {
  codigoAgrupamiento: string;
  nombreAgrupamiento: string;
  codigoProducto: string;
  descripcionProducto: string;
  aprovechamiento: number;
  grupo: string;
  existenciaActual: number;
  movimientosMensuales: MovimientoMensualReporte[];
  totalSalidas: number;
  promedioSemanal: number;
  consumoPromedioMensual: number;
  consumoPromedioDiario: number;
  inventarioDias: number | null;
  prioridadCode: PrioridadReporteCode;
  prioridad: PrioridadReporte;
}

export interface ReporteSolicitudPedidoResponse {
  contextCode: GcmContextCode;
  sedeId: number;
  periodo: {
    desde: string;
    hasta: string;
    meses: number;
  };
  productos: ProductoReporteSolicitudPedido[];
}

export type ReporteSolicitudPedidoRawRow = Record<string, unknown>;

interface ProductoAcumulado {
  codigoAgrupamiento: string;
  nombreAgrupamiento: string;
  codigoProducto: string;
  descripcionProducto: string;
  aprovechamiento: number;
  grupo: string;
  existenciaActual: number;
  movimientos: Map<string, MovimientoMensualReporte>;
}

const normalizarLlave = (llave: string): string =>
  llave
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

const normalizarFila = (fila: ReporteSolicitudPedidoRawRow): Map<string, unknown> =>
  new Map(Object.entries(fila).map(([llave, valor]) => [normalizarLlave(llave), valor]));

const numero = (valor: unknown): number => {
  if (valor === null || valor === undefined || valor === '') return 0;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
};

const texto = (valor: unknown): string => String(valor ?? '').trim();

const redondear = (valor: number): number => Number(valor.toFixed(4));

const llaveMes = (anio: number, mes: number): string => `${anio}-${mes}`;

const crearMovimientosVacios = (): Map<string, MovimientoMensualReporte> =>
  new Map(
    REPORTE_MESES.map(({ anio, mes }) => [
      llaveMes(anio, mes),
      {
        anio,
        mes,
        entrada: 0,
        salidaSinFormula: 0,
        salidaCorregida: 0,
        despachoConsumo: 0,
        salidaFV: 0,
      },
    ])
  );

export const calcularPrioridadReporte = (
  existenciaActual: number,
  promedioSemanal: number,
  consumoPromedioMensual: number,
  consumoPromedioDiario: number
): { prioridadCode: PrioridadReporteCode; prioridad: PrioridadReporte } => {
  if (consumoPromedioDiario === 0) {
    return existenciaActual > 0
      ? { prioridadCode: 1, prioridad: 'NORMAL' }
      : { prioridadCode: 2, prioridad: 'CRITICA' };
  }

  if (existenciaActual < promedioSemanal) {
    return { prioridadCode: 2, prioridad: 'CRITICA' };
  }

  if (existenciaActual < consumoPromedioMensual) {
    return { prioridadCode: 3, prioridad: 'ALTA' };
  }

  return { prioridadCode: 1, prioridad: 'NORMAL' };
};

export const transformarReporteSolicitudPedido = (
  filas: ReporteSolicitudPedidoRawRow[],
  contextCode: GcmContextCode,
  sedeId: number
): ReporteSolicitudPedidoResponse => {
  const productos = new Map<string, ProductoAcumulado>();

  filas.forEach(filaOriginal => {
    const fila = normalizarFila(filaOriginal);
    const codigoProducto = texto(fila.get('IPRCODIGO')).toUpperCase();
    if (!codigoProducto) return;

    let producto = productos.get(codigoProducto);
    if (!producto) {
      producto = {
        codigoAgrupamiento: texto(fila.get('CODAGRUPAMIENTO')),
        nombreAgrupamiento: texto(fila.get('NOMAGRUPAMIENTO')),
        codigoProducto,
        descripcionProducto: texto(fila.get('IPRDESCOR')),
        aprovechamiento: 0,
        grupo: texto(fila.get('IGRNOMBRE')),
        existenciaActual: 0,
        movimientos: crearMovimientosVacios(),
      };
      productos.set(codigoProducto, producto);
    }

    producto.aprovechamiento += numero(fila.get('APROVECHAMIENTO'));
    producto.existenciaActual = Math.max(
      producto.existenciaActual,
      Math.max(0, numero(fila.get('EXISTENCIAACTUAL')))
    );

    const anio = numero(fila.get('ANO'));
    const mes = numero(fila.get('MES'));
    const movimiento = producto.movimientos.get(llaveMes(anio, mes));
    if (!movimiento) return;

    movimiento.entrada += numero(fila.get('ENTRADA'));
    movimiento.salidaSinFormula += numero(fila.get('SALIDASINFORMULA'));
    movimiento.salidaCorregida += numero(fila.get('SALIDACORREGIDA'));
    movimiento.despachoConsumo += numero(fila.get('DESPACHOCONSUMO'));
    movimiento.salidaFV += numero(fila.get('SALIDAFV'));
  });

  const productosTransformados = [...productos.values()]
    .map(producto => {
      const movimientosMensuales = [...producto.movimientos.values()].map(movimiento => ({
        ...movimiento,
        entrada: redondear(movimiento.entrada),
        salidaSinFormula: redondear(movimiento.salidaSinFormula),
        salidaCorregida: redondear(movimiento.salidaCorregida),
        despachoConsumo: redondear(movimiento.despachoConsumo),
        salidaFV: redondear(movimiento.salidaFV),
      }));
      const totalSalidas = redondear(
        [...producto.movimientos.values()].reduce(
          (total, movimiento) => total + movimiento.salidaCorregida,
          0
        )
      );
      const consumoPromedioMensualExacto = totalSalidas / REPORTE_MESES.length;
      const promedioSemanalExacto = (consumoPromedioMensualExacto * 12) / 52;
      const consumoPromedioDiarioExacto = (consumoPromedioMensualExacto * 12) / 365;
      const consumoPromedioMensual = redondear(consumoPromedioMensualExacto);
      const promedioSemanal = redondear(promedioSemanalExacto);
      const consumoPromedioDiario = redondear(consumoPromedioDiarioExacto);
      const existenciaActual = redondear(producto.existenciaActual);
      const inventarioDias =
        consumoPromedioDiarioExacto === 0
          ? null
          : redondear(existenciaActual / consumoPromedioDiarioExacto);
      const prioridad = calcularPrioridadReporte(
        existenciaActual,
        promedioSemanalExacto,
        consumoPromedioMensualExacto,
        consumoPromedioDiarioExacto
      );

      return {
        codigoAgrupamiento: producto.codigoAgrupamiento,
        nombreAgrupamiento: producto.nombreAgrupamiento,
        codigoProducto: producto.codigoProducto,
        descripcionProducto: producto.descripcionProducto,
        aprovechamiento: redondear(producto.aprovechamiento),
        grupo: producto.grupo,
        existenciaActual,
        movimientosMensuales,
        totalSalidas,
        promedioSemanal,
        consumoPromedioMensual,
        consumoPromedioDiario,
        inventarioDias,
        ...prioridad,
      };
    })
    .sort((a, b) => a.codigoProducto.localeCompare(b.codigoProducto));

  const primerMes = REPORTE_MESES[0];
  const ultimoMes = REPORTE_MESES[REPORTE_MESES.length - 1];

  return {
    contextCode,
    sedeId,
    periodo: {
      desde: `${primerMes.anio}-${String(primerMes.mes).padStart(2, '0')}`,
      hasta: `${ultimoMes.anio}-${String(ultimoMes.mes).padStart(2, '0')}`,
      meses: REPORTE_MESES.length,
    },
    productos: productosTransformados,
  };
};
