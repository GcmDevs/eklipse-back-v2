import { clasificarCancer } from './clasificacion-cancer';

// La fecha de referencia es la del informe, nunca la fecha actual.
export function edadAlDiagnostico(
  nacimiento: string | null,
  informe: string | null
): number | null {
  if (!informe || ['1800-01-01', '1845-01-01'].includes(informe)) return null;
  return clasificarCancer('', nacimiento, informe).edad;
}
