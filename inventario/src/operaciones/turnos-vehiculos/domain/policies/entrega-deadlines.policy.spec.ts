import {
  calcCierreAutomaticoEn,
  calcFechaLimiteDotacion,
  calcHabilitaExcepcionalEn,
  calcLimiteEdicionRecepcion,
  calcLimiteInicioRecepcion,
  isBeforeDeadline,
  isPastDeadline,
} from './entrega-deadlines.policy';

const base = new Date('2026-03-10T08:00:00.000Z');

describe('entrega-deadlines.policy', () => {
  it('habilita la recepción excepcional a las 12h10m del inicio del turno', () => {
    expect(calcHabilitaExcepcionalEn(base).toISOString()).toBe('2026-03-10T20:10:00.000Z');
  });

  it('cierre automático a las 13h del inicio del turno', () => {
    expect(calcCierreAutomaticoEn(base).toISOString()).toBe('2026-03-10T21:00:00.000Z');
  });

  it('límite para iniciar recepción = entrega + 1h', () => {
    expect(calcLimiteInicioRecepcion(base).toISOString()).toBe('2026-03-10T09:00:00.000Z');
  });

  it('límite de edición de recepción = inicio de recepción + 30 min', () => {
    expect(calcLimiteEdicionRecepcion(base).toISOString()).toBe('2026-03-10T08:30:00.000Z');
  });

  it('límite de dotación = inicio + 5h', () => {
    expect(calcFechaLimiteDotacion(base).toISOString()).toBe('2026-03-10T13:00:00.000Z');
  });

  it('isBeforeDeadline es estricto (no incluye el instante límite)', () => {
    expect(isBeforeDeadline(new Date(base.getTime() - 1), base)).toBe(true);
    expect(isBeforeDeadline(base, base)).toBe(false);
    expect(isBeforeDeadline(new Date(base.getTime() + 1), base)).toBe(false);
  });

  it('isPastDeadline es inclusivo en el instante límite', () => {
    expect(isPastDeadline(new Date(base.getTime() - 1), base)).toBe(false);
    expect(isPastDeadline(base, base)).toBe(true);
    expect(isPastDeadline(new Date(base.getTime() + 1), base)).toBe(true);
  });

  it('no muta la fecha de entrada', () => {
    const original = new Date('2026-01-01T00:00:00.000Z');
    const snapshot = original.getTime();
    calcCierreAutomaticoEn(original);
    calcFechaLimiteDotacion(original);
    expect(original.getTime()).toBe(snapshot);
  });
});
