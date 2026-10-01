import { GcmContexts } from '@common/application/constants';

const CONTEXTS = [
  GcmContexts.ALTACENTRO,
  GcmContexts.VALLEDUPAR,
  GcmContexts.AGUACHICA,
  GcmContexts.SANJUAN,
  GcmContexts.AMMEDICAL,
];

/**
 * Retorna todos los contextos excepto los indicados por el solicitante.
 * @param excludedCtxs
 * @param devIncluded Indica si agrega o no el ctx de bbdd de pruebas
 * @returns Contexts[]
 */
export function allContexts(excludedCtxs: GcmContexts[] = []): GcmContexts[] {
  const validCtxs: GcmContexts[] = [];

  CONTEXTS.forEach(ctx => {
    if (!excludedCtxs.filter(el => el === ctx).length) validCtxs.push(ctx);
  });

  return validCtxs;
}
