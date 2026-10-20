import {
  CandidatoInvima,
  CriterioInvima,
  MedicamentoInput,
  ResultadoInvima,
} from './invima.models';

export const normalizarTexto = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
export const normalizarRegistro = (value: string) =>
  normalizarTexto(value)
    .replace(/^INVIMA\s*/, '')
    .replace(/\s+/g, '');
export function separarCum(value: string): [string, string] | null {
  const match = value.trim().match(/^(\d{1,12})\s*-\s*(\d{1,8})$/);
  return match ? [match[1].replace(/^0+(?=\d)/, ''), match[2].replace(/^0+(?=\d)/, '')] : null;
}
// SoQL literals escape quotes by doubling them. URLSearchParams performs URL encoding once.
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;
export function construirFiltro(input: MedicamentoInput, criterio: CriterioInvima): string {
  if (criterio === 'CUM') {
    const parts = separarCum(input.cum ?? '');
    if (!parts) throw new Error('El CUM debe tener formato expediente-consecutivo.');
    return `expedientecum = ${parts[0]} AND consecutivocum = ${parts[1]}`;
  }
  if (criterio === 'REGISTRO') {
    return `replace(replace(upper(registrosanitario), 'INVIMA', ''), ' ', '') = ${literal(normalizarRegistro(input.registroSanitario!))}`;
  }
  // contains treats %, _ and quotes as text rather than LIKE wildcards.
  return [...new Set(input.nombre.trim().split(/\s+/))]
    .map(word => `contains(unaccent(upper(producto)), unaccent(upper(${literal(word)})))`)
    .join(' AND ');
}
export function evaluarCoincidencias(
  input: MedicamentoInput,
  candidatos: CandidatoInvima[],
  criterio: CriterioInvima,
  completa: boolean,
  exhaustiva = true
): { resultado: ResultadoInvima; seleccionado: CandidatoInvima | null; advertencias: string[] } {
  const advertencias: string[] = [];
  if (input.cum && (criterio !== 'CUM' || !candidatos.length))
    advertencias.push(
      'No se encontró el CUM indicado; los resultados alternativos requieren revisión.'
    );
  if (
    input.registroSanitario &&
    candidatos.some(
      c => normalizarRegistro(c.registroSanitario) !== normalizarRegistro(input.registroSanitario!)
    )
  )
    advertencias.push('El registro sanitario encontrado difiere del ingresado.');
  const identidades = new Set(
    candidatos.map(c =>
      JSON.stringify([
        c.cum,
        normalizarRegistro(c.registroSanitario),
        c.estadoRegistro,
        c.estadoCum,
        c.nombre,
        c.presentacion,
        c.titular,
      ])
    )
  );
  const exacta =
    completa &&
    exhaustiva &&
    criterio === 'CUM' &&
    identidades.size === 1 &&
    candidatos.length > 0 &&
    advertencias.length === 0;
  return {
    resultado: !completa
      ? 'INCOMPLETA'
      : exacta
        ? 'EXACTA'
        : candidatos.length
          ? 'REVISION'
          : 'SIN_COINCIDENCIAS',
    seleccionado: exacta ? candidatos[0] : null,
    advertencias,
  };
}
