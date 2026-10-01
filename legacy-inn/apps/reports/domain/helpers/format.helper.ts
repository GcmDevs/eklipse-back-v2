import { TimerServices } from '@common/application/services/timer';
import { UnidadTiempo } from '@equipos/domain/enums';

export function truncateReportText(value: string, maxLength: number): string {
  const text = (value ?? '').trim();
  if (maxLength <= 0 || text.length <= maxLength) {
    return text;
  }

  if (maxLength <= 3) {
    return text.slice(0, maxLength);
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

export function getMedidaUnidadNombre(medida?: any): string {
  if (!medida) return '';

  return (
    medida.getUnidadNombre ??
    medida.unidadNombre ??
    medida.unidad?.simbolo ??
    medida.unidad?.nombre ??
    ''
  ).trim();
}

export function formatMedidaEtiquetaAdicional(medida?: any): string {
  const nombre = medida?.getNombre?.trim() || medida?.nombre?.trim() || 'Otro';
  const unidad = getMedidaUnidadNombre(medida);
  const label = unidad
    ? `${toReportUpper(nombre)} (${toReportUpper(unidad)})`
    : toReportUpper(nombre);

  return `${label}:`;
}

export function formatMedidaValorAdicional(medida?: any): string {
  return toReportUpper(formatMedidaValor(medida));
}

export function toReportUpper(value?: string | null): string {
  if (value == null || value === '') return '';
  return value.toLocaleUpperCase('es-CO');
}

export function ParseFechaFromUnclearType(fecha?: string | Date | null): string {
  if (!fecha) return '';
  return TimerServices.toDateOnlyString(fecha);
}

export function formatFecha(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(', ', ' ');
}

export function formatMedida(medida?: any): string | undefined {
  if (!medida) return undefined;

  const unidadNombre =
    medida.getUnidadNombre ??
    medida.unidadNombre ??
    medida.unidad?.simbolo ??
    medida.unidad?.nombre ??
    '';

  if (medida.isRango || (medida.valorMin != null && medida.valorMax != null)) {
    const min = medida.getValorMin ?? medida.valorMin;
    const max = medida.getValorMax ?? medida.valorMax;
    const unidad = unidadNombre ? ` ${unidadNombre}` : '';
    return `${min} - ${max}${unidad}`.trim();
  }

  const valor = medida.getValor ?? medida.valor;
  if (valor == null) return undefined;

  const unidad = unidadNombre ? ` ${unidadNombre}` : '';
  const nombre = medida.getNombre ?? medida.nombre;
  if (nombre) {
    return `${nombre}: ${valor}${unidad}`.trim();
  }

  return `${valor}${unidad}`.trim();
}

export function formatMedidaValor(medida?: any): string {
  if (!medida) return '—';

  const unidadNombre =
    medida.getUnidadNombre ??
    medida.unidadNombre ??
    medida.unidad?.simbolo ??
    medida.unidad?.nombre ??
    '';
  const unidad = unidadNombre ? ` ${unidadNombre}` : '';

  if (medida.isRango || (medida.valorMin != null && medida.valorMax != null)) {
    const min = medida.getValorMin ?? medida.valorMin;
    const max = medida.getValorMax ?? medida.valorMax;
    return `${min} - ${max}${unidad}`.trim();
  }

  const valor = medida.getValor ?? medida.valor;
  if (valor == null) return '—';

  return `${valor}${unidad}`.trim();
}

export function formatPeriodoTiempo(
  periodo?: { valor?: number | null; unidad?: UnidadTiempo | null } | null,
): string {
  if (!periodo || periodo.valor == null) return 'N/A';

  const unidadMap: Record<UnidadTiempo, string> = {
    [UnidadTiempo.ANIOS]: 'año(s)',
    [UnidadTiempo.MESES]: 'mes(es)',
    [UnidadTiempo.SEMANAS]: 'semana(s)'
  };

  const unidadTexto = periodo.unidad ? (unidadMap[periodo.unidad] ?? '') : '';
  return `${periodo.valor} ${unidadTexto}`.trim();
}

export function resolveContentDisposition(
  download: string | undefined,
  filename: string,
): string {
  const mode = download !== undefined ? 'attachment' : 'inline';
  return `${mode}; filename="${filename}"`;
}