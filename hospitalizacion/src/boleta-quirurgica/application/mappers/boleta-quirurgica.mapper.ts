import { sanitizeBoletaQuirurgicaKey, sanitizeBoletaQuirurgicaValue } from '../sanitizers';

type QueryRow = Record<string, unknown>;

function mapRow(row: QueryRow) {
  return Object.entries(row).reduce(
    (accumulator, [key, value]) => {
      accumulator[sanitizeBoletaQuirurgicaKey(key)] = sanitizeBoletaQuirurgicaValue(value);
      return accumulator;
    },
    {} as Record<string, unknown>
  );
}

export function mapBoletaQuirurgicaRows<T extends QueryRow>(rows: T[]) {
  return rows.map(row => mapRow(row));
}

export function mapBoletaQuirurgicaDetalle(detail: {
  paciente?: QueryRow[];
  procedimientos: QueryRow[];
  cupsAutorizados: QueryRow[];
  programacion: QueryRow[];
  cirugiasRealizadas: QueryRow[];
  gestorqx: QueryRow[];
  maos: QueryRow[];
  auditoria: QueryRow[];
  auditoriaPre?: QueryRow[];
}) {
  const cirugiasRealizadas = mapBoletaQuirurgicaRows(detail.cirugiasRealizadas);
  const programacion = mapBoletaQuirurgicaRows(detail.programacion).map(item => ({
    ...item,
    cirugiasRealizadas,
  }));

  return {
    paciente: mapBoletaQuirurgicaRows(detail.paciente ?? []),
    procedimientos: mapBoletaQuirurgicaRows(detail.procedimientos),
    cupsAutorizados: mapBoletaQuirurgicaRows(detail.cupsAutorizados),
    programacion,
    cirugiasRealizadas,
    gestorqx: mapBoletaQuirurgicaRows(detail.gestorqx),
    maos: mapBoletaQuirurgicaRows(detail.maos),
    auditoria: mapBoletaQuirurgicaRows(detail.auditoria),
    auditoriaPre: mapBoletaQuirurgicaRows(detail.auditoriaPre ?? []),
  };
}
