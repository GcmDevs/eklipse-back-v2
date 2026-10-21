import {
  CandidatoInvima,
  CriterioInvima,
  MedicamentoInput,
  ResultadoInvima,
  esMedicamento,
  FuenteInvima,
  GRUPOS_REGISTROS,
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
export function construirFiltro(
  input: MedicamentoInput,
  criterio: CriterioInvima,
  fuente?: FuenteInvima
): string {
  const dispositivo = fuente ? fuente.id === 'dispositivos' : input.tipo === 'DISPOSITIVO';
  const grupo =
    fuente?.id === 'registros'
      ? fuente.grupo
      : !fuente && input.tipo
        ? GRUPOS_REGISTROS[input.tipo]
        : undefined;
  const registros = fuente?.id === 'registros' || !!grupo;
  if (registros && !grupo) throw new Error('La fuente de registros requiere un grupo.');
  if (criterio === 'CUM') {
    if (!esMedicamento(input.tipo) || registros || dispositivo)
      throw new Error('Esta categoría no se consulta por CUM.');
    const parts = separarCum(input.cum ?? '');
    if (!parts) throw new Error('El CUM debe tener formato expediente-consecutivo.');
    return `expedientecum = ${parts[0]} AND consecutivocum = ${parts[1]}`;
  }
  if (criterio === 'REGISTRO') {
    const filtro = `replace(replace(upper(${registros ? 'rsynso' : dispositivo ? 'registro_sanitario' : 'registrosanitario'}), 'INVIMA', ''), ' ', '') = ${literal(normalizarRegistro(input.registroSanitario!))}`;
    return grupo ? `grupo = ${literal(grupo)} AND (${filtro})` : filtro;
  }
  // contains treats %, _ and quotes as text rather than LIKE wildcards.
  const filtro = [...new Set(input.nombre.trim().split(/\s+/))]
    .map(
      word =>
        `contains(unaccent(upper(${dispositivo ? 'prodcuto' : 'producto'})), unaccent(upper(${literal(word)})))`
    )
    .join(' AND ');
  return grupo ? `grupo = ${literal(grupo)} AND (${filtro})` : filtro;
}
export function evaluarCoincidencias(
  input: MedicamentoInput,
  candidatos: CandidatoInvima[],
  criterio: CriterioInvima,
  completa: boolean,
  exhaustiva = true
): { resultado: ResultadoInvima; seleccionado: CandidatoInvima | null; advertencias: string[] } {
  const advertencias: string[] = [];
  if (input.registroSanitario && criterio === 'NOMBRE')
    advertencias.push(
      completa
        ? 'No se encontró el registro sanitario indicado; las alternativas requieren revisión.'
        : 'No fue posible confirmar el registro sanitario indicado con cobertura completa.'
    );
  if (esMedicamento(input.tipo) && input.cum && (criterio !== 'CUM' || !candidatos.length))
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
    esMedicamento(input.tipo) &&
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
