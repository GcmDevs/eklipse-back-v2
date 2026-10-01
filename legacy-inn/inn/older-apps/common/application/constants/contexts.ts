import { GcmContexts } from '@common/application/constants';

export * from '@common/application/constants/contexts';

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
export function allContexts(
  excludedCtxs: GcmContexts[] = [GcmContexts.DEVELOPMENT, GcmContexts.EKLIPSE]
): GcmContexts[] {
  const validCtxs: GcmContexts[] = [];

  CONTEXTS.forEach(ctx => {
    if (!excludedCtxs.filter(el => el === ctx).length) validCtxs.push(ctx);
  });

  return validCtxs;
}
