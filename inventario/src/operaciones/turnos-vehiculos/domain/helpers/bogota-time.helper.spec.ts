import {
  addDaysYmd,
  dayFromDateString,
  fechaColumnaToYmd,
  fechaNegocioBogota,
  finDiaBogota,
  monthBounds,
  toIsoDateTime,
  todayDateStringBogota,
} from './bogota-time.helper';

describe('fechaNegocioBogota', () => {
  it('2026-10-18T07:09:00Z (02:09 Bogotá) → 2026-10-18', () => {
    expect(fechaNegocioBogota(new Date('2026-10-18T07:09:00.000Z'))).toBe('2026-10-18');
  });

  it('2026-10-19T03:30:00Z (22:30 Bogotá del 18) → 2026-10-18', () => {
    expect(fechaNegocioBogota(new Date('2026-10-19T03:30:00.000Z'))).toBe('2026-10-18');
  });

  it('2026-10-19T05:00:00Z (00:00 Bogotá del 19) → 2026-10-19', () => {
    expect(fechaNegocioBogota(new Date('2026-10-19T05:00:00.000Z'))).toBe('2026-10-19');
  });

  it('todayDateStringBogota es alias de fechaNegocioBogota', () => {
    const ref = new Date('2026-10-19T03:30:00.000Z');
    expect(todayDateStringBogota(ref)).toBe(fechaNegocioBogota(ref));
  });
});

describe('fechaColumnaToYmd (serialización DATE)', () => {
  it('string YYYY-MM-DD se conserva', () => {
    expect(fechaColumnaToYmd('2026-10-18')).toBe('2026-10-18');
  });

  it('Date a medianoche UTC (hidrata TypeORM) no corre el día', () => {
    expect(fechaColumnaToYmd(new Date('2026-10-18T00:00:00.000Z'))).toBe('2026-10-18');
  });

  it('NO usar fechaNegocioBogota sobre DATE: correría al 17', () => {
    const hidratada = new Date('2026-10-18T00:00:00.000Z');
    expect(fechaNegocioBogota(hidratada)).toBe('2026-10-17');
    expect(fechaColumnaToYmd(hidratada)).toBe('2026-10-18');
  });
});

describe('monthBounds / day / iso', () => {
  it('monthBounds calcula el fin de mes y la cantidad de días', () => {
    expect(monthBounds(2024, 2)).toEqual({ desde: '2024-02-01', hasta: '2024-02-29', diasEnMes: 29 });
    expect(monthBounds(2023, 2)).toEqual({ desde: '2023-02-01', hasta: '2023-02-28', diasEnMes: 28 });
    expect(monthBounds(2026, 4)).toEqual({ desde: '2026-04-01', hasta: '2026-04-30', diasEnMes: 30 });
  });

  it('anio viaja como número', () => {
    expect(typeof monthBounds(2026, 1).desde).toBe('string');
    expect(monthBounds(2026, 1).desde.startsWith('2026')).toBe(true);
  });

  it('dayFromDateString extrae el día', () => {
    expect(dayFromDateString('2026-03-07')).toBe(7);
  });

  it('toIsoDateTime / addDays / finDiaBogota', () => {
    expect(toIsoDateTime(null)).toBeNull();
    expect(addDaysYmd('2026-10-18', 1)).toBe('2026-10-19');
    expect(finDiaBogota('2026-10-18').toISOString()).toBe('2026-10-19T04:59:59.999Z');
  });
});
