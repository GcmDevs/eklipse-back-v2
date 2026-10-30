import {
  TOLERANCIA_PLAZO_MS,
  decidirVencimientoJob,
  vencimientoJobKey,
} from './vencimiento-job.policy';

const plazo = new Date('2026-03-10T20:00:00.000Z');
const antes = (ms: number) => new Date(plazo.getTime() - ms);
const despues = (ms: number) => new Date(plazo.getTime() + ms);

describe('decidirVencimientoJob', () => {
  const base = { pendiente: true, fechaLimiteActual: plazo, fechaLimiteEsperada: plazo };

  it('ejecuta cuando el plazo coincide y ya se cumplió', () => {
    expect(decidirVencimientoJob({ ...base, now: despues(5) })).toBe('EJECUTAR');
  });

  it('ejecuta exactamente en el instante del plazo (inclusivo)', () => {
    expect(decidirVencimientoJob({ ...base, now: plazo })).toBe('EJECUTAR');
  });

  it('un plazo ya vencido hace mucho se ejecuta sin esperas adicionales', () => {
    expect(decidirVencimientoJob({ ...base, now: despues(3 * 3_600_000) })).toBe('EJECUTAR');
  });

  it('reintenta si despertó antes del plazo (deriva de relojes)', () => {
    expect(decidirVencimientoJob({ ...base, now: antes(500) })).toBe('REINTENTAR_AUN_NO_VENCE');
  });

  it('omite si el registro ya no está pendiente (cerrado, bloqueado o inexistente)', () => {
    expect(
      decidirVencimientoJob({ ...base, pendiente: false, now: despues(5) }),
    ).toBe('OMITIR_NO_PENDIENTE');
    expect(
      decidirVencimientoJob({ ...base, fechaLimiteActual: null, now: despues(5) }),
    ).toBe('OMITIR_NO_PENDIENTE');
  });

  it('omite un job viejo cuando el plazo guardado cambió (aunque el nuevo ya venció)', () => {
    const nuevo = despues(60 * 60_000);
    expect(
      decidirVencimientoJob({ ...base, fechaLimiteActual: nuevo, now: despues(2 * 60 * 60_000) }),
    ).toBe('OMITIR_PLAZO_CAMBIADO');
  });

  it('tolera diferencias de redondeo dentro de la tolerancia', () => {
    expect(
      decidirVencimientoJob({
        ...base,
        fechaLimiteActual: despues(TOLERANCIA_PLAZO_MS - 1),
        now: despues(TOLERANCIA_PLAZO_MS + 10),
      }),
    ).toBe('EJECUTAR');
  });

  it('el estado no pendiente gana sobre el plazo distinto', () => {
    expect(
      decidirVencimientoJob({
        ...base,
        pendiente: false,
        fechaLimiteActual: despues(60_000),
        now: despues(1_000_000),
      }),
    ).toBe('OMITIR_NO_PENDIENTE');
  });
});

describe('vencimientoJobKey', () => {
  it('es estable y distingue tipo y entidad', () => {
    expect(vencimientoJobKey('DOTACION', 12)).toBe('DOTACION-12');
    expect(vencimientoJobKey('ENTREGA_CIERRE', 12)).not.toBe(vencimientoJobKey('ENTREGA_RECEPCION', 12));
    expect(vencimientoJobKey('DOTACION', 12)).toBe(vencimientoJobKey('DOTACION', 12));
  });
});
