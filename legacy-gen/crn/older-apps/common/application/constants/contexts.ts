import { GcmContexts } from '@common/application/constants';

export { GcmContexts } from '@common/application/constants';

export const CONTEXTS_DESCRIPTION = [
  { value: GcmContexts.ALTACENTRO, option: 'Centro/Alta Complejidad' },
  { value: GcmContexts.SANJUAN, option: 'San Juan Bautista' },
  { value: GcmContexts.AMMEDICAL, option: 'AM Medical' },
  { value: GcmContexts.VALLEDUPAR, option: 'Clinica Valledupar' },
  { value: GcmContexts.AGUACHICA, option: 'Alta Complejidad Aguachica' },
  { value: GcmContexts.DEVELOPMENT, option: 'Sistemas & Desarrollo' },
];

const CONTEXTS = [
  GcmContexts.ALTACENTRO,
  GcmContexts.VALLEDUPAR,
  GcmContexts.AGUACHICA,
  GcmContexts.SANJUAN,
  GcmContexts.AMMEDICAL,
  GcmContexts.DEVELOPMENT,
];

/**
 * Retorna todos los contextos excepto los indicados por el solicitante.
 * @param excludedCtxs
 * @param devIncluded Indica si agrega o no el ctx de bbdd de pruebas
 * @returns Contexts[]
 */
export function allContexts(excludedCtxs: GcmContexts[] = [], onlyCanon = false): GcmContexts[] {
  const validCtxs: GcmContexts[] = [];
  const ctxs = onlyCanon
    ? CONTEXTS.filter(ctx => [GcmContexts.DEVELOPMENT, GcmContexts.EKLIPSE].indexOf(ctx) >= 0)
    : CONTEXTS;

  ctxs.forEach(ctx => {
    if (!excludedCtxs.filter(el => el === ctx).length) validCtxs.push(ctx);
  });

  return validCtxs;
}
