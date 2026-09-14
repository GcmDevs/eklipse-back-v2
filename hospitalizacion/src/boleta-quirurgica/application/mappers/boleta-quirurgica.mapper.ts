import { sanitizeBoletaQuirurgicaKey, sanitizeBoletaQuirurgicaValue } from '../sanitizers';

type QueryRow = Record<string, unknown>;

function mapRow(row: QueryRow) {
  return Object.entries(row).reduce((accumulator, [key, value]) => {
    accumulator[sanitizeBoletaQuirurgicaKey(key)] = sanitizeBoletaQuirurgicaValue(value);
    return accumulator;
  }, {} as Record<string, unknown>);
}

export function mapBoletaQuirurgicaRows<T extends QueryRow>(rows: T[]) {
  return rows.map(row => mapRow(row));
}

export function mapBoletaQuirurgicaDetalle(detail: {
  procedimientos: QueryRow[];
  cupsAutorizados: QueryRow[];
  programacion: QueryRow[];
  cirugiasRealizadas: QueryRow[];
  gestorqx: QueryRow[];
  maos: QueryRow[];
  auditoria: QueryRow[];
}) {
  const cirugiasRealizadas = mapBoletaQuirurgicaRows(detail.cirugiasRealizadas);
  const programacion = mapBoletaQuirurgicaRows(detail.programacion).map(item => ({
    ...item,
    cirugiasRealizadas,
  }));

  return {
    procedimientos: mapBoletaQuirurgicaRows(detail.procedimientos),
    cupsAutorizados: mapBoletaQuirurgicaRows(detail.cupsAutorizados),
    programacion,
    gestorqx: mapBoletaQuirurgicaRows(detail.gestorqx),
    maos: mapBoletaQuirurgicaRows(detail.maos),
    auditoria: mapBoletaQuirurgicaRows(detail.auditoria),
  };
}
