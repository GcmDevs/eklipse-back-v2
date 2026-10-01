import { BadInputError } from '@common/domain/errors';
import { normalizeUppercaseText } from '@common/domain/value-objects';

export function resolveAplicaGarantia(
  aplicaGarantia?: boolean,
  fechaVencimientoGarantia?: Date | null
): { aplicaGarantia: boolean; fechaVencimientoGarantia?: Date } {
  const aplica = aplicaGarantia ?? !!fechaVencimientoGarantia;

  if (aplica && !fechaVencimientoGarantia) {
    throw new BadInputError('Si aplica garantía debe indicar fecha de vencimiento');
  }

  if (!aplica && fechaVencimientoGarantia) {
    throw new BadInputError(
      'Si no aplica garantía no debe tener fecha de vencimiento de esta misma'
    );
  }

  return {
    aplicaGarantia: aplica,
    fechaVencimientoGarantia: aplica ? fechaVencimientoGarantia : undefined,
  };
}

export function normalizeLocalizacion(localizacion?: string | null): string {
  const normalized = normalizeUppercaseText(localizacion);
  return normalized || 'DESCONOCIDA';
}
