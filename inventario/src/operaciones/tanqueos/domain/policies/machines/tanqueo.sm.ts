import { BadInputError } from '@common/domain/errors';
import { EstadoTanqueo } from '../../enums/estados.enum';

const TANQUEO_STATE_TRANSITIONS: Record<EstadoTanqueo, readonly EstadoTanqueo[]> = {
  [EstadoTanqueo.APTO_PARA_REVISION]: [
    EstadoTanqueo.VALIDADO_MANUALMENTE,
    EstadoTanqueo.ANULADO,
  ],
  [EstadoTanqueo.VALIDADO_AUTOMATICAMENTE]: [
    EstadoTanqueo.ANULADO,
    EstadoTanqueo.VALIDADO_MANUALMENTE,
  ],
  [EstadoTanqueo.VALIDADO_MANUALMENTE]: [
    EstadoTanqueo.ANULADO,
    EstadoTanqueo.APTO_PARA_REVISION,
  ],
  [EstadoTanqueo.ANULADO]: [],
};

export function canTanqueoTransitionState(from: EstadoTanqueo, to: EstadoTanqueo): boolean {
  return TANQUEO_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTanqueoTransitionState(from: EstadoTanqueo, to: EstadoTanqueo): void {
  if (!canTanqueoTransitionState(from, to)) {
    throw new BadInputError(`Transición de estado no permitida: ${from} → ${to}`);
  }
}

export function tanqueoInitialState(hasOpenCriticalInconsistency: boolean): EstadoTanqueo {
  return hasOpenCriticalInconsistency
    ? EstadoTanqueo.APTO_PARA_REVISION
    : EstadoTanqueo.VALIDADO_AUTOMATICAMENTE;
}

export function canTanqueoMarkReviewed(from: EstadoTanqueo): boolean {
  return from === EstadoTanqueo.VALIDADO_AUTOMATICAMENTE;
}

export function assertTanqueoMarkReviewed(from: EstadoTanqueo): void {
  if (!canTanqueoMarkReviewed(from)) {
    throw new BadInputError(
      `Solo un tanqueo VALIDADO_AUTOMATICAMENTE puede marcarse como revisado (estado actual: ${from})`
    );
  }
}
