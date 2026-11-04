import { GCM_CONTEXTS } from '@common/domain/types';
import { ScheduleOrm } from '../orm/schedule.orm';
import { crearCierreDieta, diaBogota, siguienteMedianocheBogota } from './horarios-automaticos';

describe('horarios automáticos de dietas', () => {
  const context = GCM_CONTEXTS.ALTACENTRO;
  const horario = (name: string, minutes: number, days = 0) =>
    Object.assign(new ScheduleOrm(), {
      id: 7,
      clientId: 2,
      name,
      endTimeInMinutes: minutes,
      endDaysBeforeNow: days,
    });

  it.each([
    ['DESAYUNO', 420, 1, '2026-11-04T12:00:01.000Z'],
    ['ALMUERZO', 660, 2, '2026-11-04T16:00:01.000Z'],
    ['CENA', 1020, 3, '2026-11-04T22:00:01.000Z'],
  ])('programa %s un segundo después del cierre', (name, minutes, code, instant) => {
    const cierre = crearCierreDieta(context, horario(name, minutes), '2026-11-04');
    expect(cierre.jornadaCode).toBe(code);
    expect(cierre.ejecutarEn.toISOString()).toBe(instant);
    expect(cierre.fecha.toISOString()).toBe('2026-11-04T00:00:00.000Z');
  });

  it('conserva la fecha futura de jornada si su plazo vence días antes', () => {
    const cierre = crearCierreDieta(context, horario('DESAYUNO', 1380, 2), '2026-12-31');
    expect(cierre.cierre.toISOString()).toBe('2027-01-01T04:00:00.000Z');
    expect(cierre.fecha.toISOString()).toBe('2027-01-02T00:00:00.000Z');
  });

  it('calcula día y medianoche en Bogotá aunque el host use UTC', () => {
    const now = new Date('2026-11-05T03:30:00Z');
    expect(diaBogota(now)).toBe('2026-11-04');
    expect(siguienteMedianocheBogota(now).toISOString()).toBe('2026-11-05T05:00:00.000Z');
  });

  it.each([null, -1, 1440, 420.5])('rechaza hora final inválida %s', minutes => {
    expect(() => crearCierreDieta(context, horario('DESAYUNO', minutes), '2026-11-04')).toThrow();
  });

  it('rechaza jornadas desconocidas', () => {
    expect(() => crearCierreDieta(context, horario('MERIENDA', 420), '2026-11-04')).toThrow();
  });
});
