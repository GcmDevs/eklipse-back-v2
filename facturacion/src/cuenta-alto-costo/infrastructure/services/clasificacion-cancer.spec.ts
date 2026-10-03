import { clasificarCancer } from './clasificacion-cancer';

describe('Clasificación oncológica desde el nacimiento', () => {
  const hoy = '2026-09-28';
  const clasificar = (codigo: string, nacimiento: string | null = '2000-01-01') =>
    clasificarCancer(codigo, nacimiento, hoy);
  it('aplica todos los prefijos independientes de edad', () => {
    const casos: [string, number][] = [
      ['C509', 1],
      ['C539', 2],
      ['C180', 3],
      ['C19', 3],
      ['C20', 3],
      ['C169', 4],
      ['C61', 5],
      ['C33', 6],
      ['C349', 6],
    ];
    for (const [codigo, esperado] of casos) expect(clasificar(codigo, null).codigo).toBe(esperado);
  });
  it('distingue la víspera, el día y el día posterior al cumpleaños 18', () => {
    expect(clasificar('C910', '2008-09-29').codigo).toBe(7);
    expect(clasificar('C910', '2008-09-28').codigo).toBe(8);
    expect(clasificar('C910', '2008-09-27').codigo).toBe(8);
    expect(clasificar('C910', '2008-09-29').edad).toBe(17);
    expect(clasificar('C910', '2008-09-28').edad).toBe(18);
  });
  it('clasifica las tres leucemias mieloides para ambos grupos de edad', () => {
    for (const codigo of ['C920', 'C924', 'C925']) {
      expect(clasificar(codigo, '2010-01-01').codigo).toBe(9);
      expect(clasificar(codigo).codigo).toBe(10);
    }
  });
  it('clasifica linfoma en adultos y no priorizados en menores', () => {
    for (const codigo of ['C820', 'C831', 'C849', 'C859']) {
      expect(clasificar(codigo, '2010-01-01').codigo).toBe(12);
      expect(clasificar(codigo).codigo).toBe(11);
    }
  });
  it('normaliza puntos, espacios y minúsculas', () => {
    expect(clasificar(' c91.0 ').codigo).toBe(8);
    expect(clasificar('c50.9').codigo).toBe(1);
  });
  it('no extiende las reglas exactas a otras leucemias', () => {
    for (const codigo of ['C911', 'C919', 'C921', 'C923', 'C000']) {
      expect(clasificar(codigo, null).codigo).toBe(12);
    }
  });
  it('no convierte fechas ausentes, especiales, imposibles o futuras en edades', () => {
    for (const fecha of [
      null,
      '',
      '1800-01-01',
      '1845-01-01',
      '2025-02-29',
      '2026-09-29',
      '0000-01-01',
    ]) {
      for (const codigo of ['C910', 'C924', 'C820']) {
        expect(clasificar(codigo, fecha).codigo).toBeNull();
        expect(clasificar(codigo, fecha).edad).toBeNull();
      }
    }
  });
  it('cuenta correctamente los nacimientos en año bisiesto', () => {
    expect(clasificarCancer('C910', '2008-02-29', '2026-02-28').edad).toBe(17);
    expect(clasificarCancer('C910', '2008-02-29', '2026-03-01').edad).toBe(18);
    expect(clasificar('C910', hoy).edad).toBe(0);
  });
  it('no asigna No priorizados sin un CIE-10 seleccionado', () => {
    expect(clasificar('').codigo).toBeNull();
  });
});
