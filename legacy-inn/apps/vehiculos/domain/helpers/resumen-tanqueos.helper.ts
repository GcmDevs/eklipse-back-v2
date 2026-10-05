import { EstadoTanqueo, OrigenTanqueo, TipoCombustible, UnidadMedidaCombustible } from '../enums';
import { ResumenTanqueosRead } from '../reads';
import { TanqueoFilters } from '../repositories/tanqueo.repository';
import { TanqueoResumenRow } from '../types/tanqueo-resumen-row.type';

const LITROS_POR_GALON = 3.785411784;

export function cantidadEnGalones(
  cantidad: number,
  unidad: UnidadMedidaCombustible | null
): number {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return 0;
  if (unidad === UnidadMedidaCombustible.LITROS) {
    return cantidad / LITROS_POR_GALON;
  }
  return cantidad;
}

function rowsParaAnalitica(rows: TanqueoResumenRow[]): TanqueoResumenRow[] {
  return rows.filter(
    r => r.estado !== EstadoTanqueo.RECHAZADO && r.origen === OrigenTanqueo.ESTACION
  );
}

function precioPromedioPorGalonDesdeFilas(filas: TanqueoResumenRow[]): number | null {
  let totalValor = 0;
  let totalGal = 0;
  for (const r of filas) {
    const valor = r.valorTotalPagado ?? 0;
    const gal = cantidadEnGalones(r.cantidadCombustible ?? 0, r.unidadMedidaCombustible);
    if (valor > 0 && gal > 0) {
      totalValor += valor;
      totalGal += gal;
    }
  }
  if (totalGal <= 0) return null;
  return totalValor / totalGal;
}

export function buildResumenTanqueos(
  rows: TanqueoResumenRow[],
  placasPorActivoId: Map<number, string>,
  filters?: TanqueoFilters,
  rowsPeriodoAnterior?: TanqueoResumenRow[]
): ResumenTanqueosRead {
  const porEstado: Record<string, number> = {};
  const porTipoCombustible: Record<string, number> = {};
  let totalFiltrado = 0;

  for (const row of rows) {
    totalFiltrado += 1;
    porEstado[row.estado] = (porEstado[row.estado] ?? 0) + 1;
    const tipo = row.tipoCombustible ?? 'SIN_TIPO';
    porTipoCombustible[tipo] = (porTipoCombustible[tipo] ?? 0) + 1;
  }

  const analitica = rowsParaAnalitica(rows);
  let totalValorPagado = 0;
  let totalCantidadGal = 0;
  let totalKm = 0;
  const galPorTipo = new Map<TipoCombustible, number>();
  const valorPorTipo = new Map<TipoCombustible, number>();
  const gastoPorActivo = new Map<number, number>();
  const rendimientoPorActivo = new Map<number, { sum: number; count: number }>();
  const rendimientos: number[] = [];

  for (const r of analitica) {
    const valor = r.valorTotalPagado ?? 0;
    const gal = cantidadEnGalones(r.cantidadCombustible ?? 0, r.unidadMedidaCombustible);
    totalValorPagado += valor;
    totalCantidadGal += gal;
    const km = r.kilometrosRecorridos ?? 0;
    if (km > 0) totalKm += km;

    if (r.tipoCombustible && gal > 0) {
      galPorTipo.set(r.tipoCombustible, (galPorTipo.get(r.tipoCombustible) ?? 0) + gal);
      valorPorTipo.set(r.tipoCombustible, (valorPorTipo.get(r.tipoCombustible) ?? 0) + valor);
    }

    if (valor > 0) {
      gastoPorActivo.set(r.activoId, (gastoPorActivo.get(r.activoId) ?? 0) + valor);
    }

    if (r.rendimiento != null && r.rendimiento > 0) {
      rendimientos.push(r.rendimiento);
      const acc = rendimientoPorActivo.get(r.activoId) ?? { sum: 0, count: 0 };
      acc.sum += r.rendimiento;
      acc.count += 1;
      rendimientoPorActivo.set(r.activoId, acc);
    }
  }

  const promedioRendimiento =
    rendimientos.length > 0 ? rendimientos.reduce((a, b) => a + b, 0) / rendimientos.length : 0;

  const precioPromedioPorGalon = precioPromedioPorGalonDesdeFilas(analitica);
  const costoPromedioPorKm =
    totalKm > 0 && totalValorPagado > 0 ? totalValorPagado / totalKm : null;

  let variacionPrecioVsPeriodoAnterior: number | null = null;
  if (rowsPeriodoAnterior?.length) {
    const precioAnterior = precioPromedioPorGalonDesdeFilas(rowsParaAnalitica(rowsPeriodoAnterior));
    if (precioAnterior != null && precioPromedioPorGalon != null && precioAnterior > 0) {
      variacionPrecioVsPeriodoAnterior =
        ((precioPromedioPorGalon - precioAnterior) / precioAnterior) * 100;
    }
  }

  const rendimientoPromedioPorActivo: { activoId: number; promedio: number }[] = [];
  for (const [activoId, { sum, count }] of rendimientoPorActivo) {
    if (count > 0) rendimientoPromedioPorActivo.push({ activoId, promedio: sum / count });
  }

  const mayorConsumoEntry = rendimientoPromedioPorActivo.length
    ? rendimientoPromedioPorActivo.reduce((min, cur) => (cur.promedio < min.promedio ? cur : min))
    : null;
  const menorConsumoEntry = rendimientoPromedioPorActivo.length
    ? rendimientoPromedioPorActivo.reduce((max, cur) => (cur.promedio > max.promedio ? cur : max))
    : null;

  const combustibleEntries = [...galPorTipo.entries()].map(([tipo, galones]) => ({
    tipoCombustible: tipo,
    galones,
  }));
  const masComprado = combustibleEntries.length
    ? combustibleEntries.reduce((a, b) => (b.galones > a.galones ? b : a))
    : null;
  const menosComprado = combustibleEntries.length
    ? combustibleEntries.reduce((a, b) => (b.galones < a.galones ? b : a))
    : null;

  const precioPorTipo = [...valorPorTipo.entries()]
    .map(([tipo, valor]) => {
      const gal = galPorTipo.get(tipo) ?? 0;
      return {
        tipoCombustible: tipo,
        precioPromedioPorGalon: gal > 0 ? valor / gal : 0,
      };
    })
    .filter(p => p.precioPromedioPorGalon > 0);

  const masCaro = precioPorTipo.length
    ? precioPorTipo.reduce((a, b) => (b.precioPromedioPorGalon > a.precioPromedioPorGalon ? b : a))
    : null;
  const masBarato = precioPorTipo.length
    ? precioPorTipo.reduce((a, b) => (b.precioPromedioPorGalon < a.precioPromedioPorGalon ? b : a))
    : null;

  const gastoEntries = [...gastoPorActivo.entries()].map(([activoId, totalGastado]) => ({
    activoId,
    totalGastado,
  }));
  const mayorGasto = gastoEntries.length
    ? gastoEntries.reduce((a, b) => (b.totalGastado > a.totalGastado ? b : a))
    : null;
  const menorGasto = gastoEntries.length
    ? gastoEntries.reduce((a, b) => (b.totalGastado < a.totalGastado ? b : a))
    : null;

  const placa = (activoId: number) => placasPorActivoId.get(activoId);

  return {
    totalFiltrado,
    totalValorPagado,
    totalCantidadCombustible: totalCantidadGal,
    promedioRendimiento,
    porEstado: porEstado as ResumenTanqueosRead['porEstado'],
    porTipoCombustible,
    costoPromedioPorKm,
    precioPromedioPorGalon,
    variacionPrecioVsPeriodoAnterior,
    consumoVehiculos: {
      mayorConsumo: mayorConsumoEntry
        ? {
            vehiculoId: mayorConsumoEntry.activoId,
            placa: placa(mayorConsumoEntry.activoId),
            rendimiento: mayorConsumoEntry.promedio,
          }
        : null,
      menorConsumo: menorConsumoEntry
        ? {
            vehiculoId: menorConsumoEntry.activoId,
            placa: placa(menorConsumoEntry.activoId),
            rendimiento: menorConsumoEntry.promedio,
          }
        : null,
    },
    combustibleComprado: {
      masComprado: masComprado
        ? { tipoCombustible: masComprado.tipoCombustible, galones: masComprado.galones }
        : null,
      menosComprado: menosComprado
        ? { tipoCombustible: menosComprado.tipoCombustible, galones: menosComprado.galones }
        : null,
    },
    precioCombustible: {
      masCaro: masCaro
        ? {
            tipoCombustible: masCaro.tipoCombustible,
            precioPromedioPorGalon: masCaro.precioPromedioPorGalon,
          }
        : null,
      masBarato: masBarato
        ? {
            tipoCombustible: masBarato.tipoCombustible,
            precioPromedioPorGalon: masBarato.precioPromedioPorGalon,
          }
        : null,
    },
    gastoVehiculos: {
      mayorGasto: mayorGasto
        ? {
            vehiculoId: mayorGasto.activoId,
            placa: placa(mayorGasto.activoId),
            totalGastado: mayorGasto.totalGastado,
          }
        : null,
      menorGasto: menorGasto
        ? {
            vehiculoId: menorGasto.activoId,
            placa: placa(menorGasto.activoId),
            totalGastado: menorGasto.totalGastado,
          }
        : null,
    },
  };
}

export function filtersPeriodoAnterior(filters: TanqueoFilters): TanqueoFilters | null {
  if (!filters.fechaDesde || !filters.fechaHasta) return null;
  const duracionMs = filters.fechaHasta.getTime() - filters.fechaDesde.getTime();
  if (duracionMs <= 0) return null;
  const fechaHastaAnterior = new Date(filters.fechaDesde.getTime() - 1);
  const fechaDesdeAnterior = new Date(fechaHastaAnterior.getTime() - duracionMs);
  return {
    ...filters,
    fechaDesde: fechaDesdeAnterior,
    fechaHasta: fechaHastaAnterior,
  };
}
