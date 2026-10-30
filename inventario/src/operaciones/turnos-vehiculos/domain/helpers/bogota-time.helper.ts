/**
 * Día de negocio en America/Bogota.
 * Offset fijo UTC−5, sin DST. No usa `process.env.TZ` ni la zona del host.
 */
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

/**
 * Convierte un instante a `YYYY-MM-DD` del día de negocio Bogotá.
 * Independiente de la zona del proceso: aplica −5 h sobre el epoch UTC.
 */
export function fechaNegocioBogota(instante: Date): string {
  const shifted = new Date(instante.getTime() + BOGOTA_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Alias de `fechaNegocioBogota`. Conservado por llamadas existentes. */
export function todayDateStringBogota(ref: Date = new Date()): string {
  return fechaNegocioBogota(ref);
}

/**
 * Normaliza una columna SQL `DATE` a `YYYY-MM-DD`.
 * TypeORM/mssql hidrata DATE como `Date` a medianoche UTC del calendario almacenado.
 * Aplicar Bogotá a ese Date corre el día atrás (origen del 17/10 con inicio 18/10 02:09).
 * Nunca usar `fechaNegocioBogota` sobre una DATE: usar UTC calendar o el string crudo.
 */
export function fechaColumnaToYmd(value: string | Date): string {
  if (typeof value === 'string') {
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, '0');
  const d = String(value.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function monthBounds(anio: number, mes: number): {
  desde: string;
  hasta: string;
  diasEnMes: number;
} {
  const diasEnMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const m = String(mes).padStart(2, '0');
  return {
    desde: `${anio}-${m}-01`,
    hasta: `${anio}-${m}-${String(diasEnMes).padStart(2, '0')}`,
    diasEnMes,
  };
}

export function dayFromDateString(fecha: string): number {
  return Number(fecha.slice(8, 10));
}

export function toIsoDateTime(d: Date | undefined | null): string | null {
  return d ? d.toISOString() : null;
}

/** 23:59:59.999 del día Bogotá (`fecha` = YYYY-MM-DD). */
export function finDiaBogota(fecha: string): Date {
  return new Date(`${fecha}T23:59:59.999-05:00`);
}

/** 00:00:00.000 del día Bogotá. */
export function inicioDiaBogota(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000-05:00`);
}

export function addDaysYmd(fecha: string, days: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const dt = new Date(utc);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
