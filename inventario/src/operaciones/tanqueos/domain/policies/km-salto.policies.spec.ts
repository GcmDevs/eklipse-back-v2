import {
  KM_SALTO_FACTOR,
  KM_SALTO_RENDIMIENTO_DEFAULT,
  umbralSaltoKilometraje,
} from './km-salto.policies';

describe('umbralSaltoKilometraje', () => {
  it('usa capacidad * rendimiento * factor cuando ambos son válidos', () => {
    expect(umbralSaltoKilometraje(55, 10)).toBe(Math.round(55 * 10 * KM_SALTO_FACTOR));
  });

  it('usa rendimiento por defecto cuando el rendimiento es nulo o no positivo', () => {
    expect(umbralSaltoKilometraje(55, null)).toBe(
      Math.round(55 * KM_SALTO_RENDIMIENTO_DEFAULT * KM_SALTO_FACTOR)
    );
    expect(umbralSaltoKilometraje(55, 0)).toBe(
      Math.round(55 * KM_SALTO_RENDIMIENTO_DEFAULT * KM_SALTO_FACTOR)
    );
  });

  it('sin capacidad usa el umbral base 50x', () => {
    const esperado = Math.round(KM_SALTO_RENDIMIENTO_DEFAULT * KM_SALTO_FACTOR * 50);
    expect(umbralSaltoKilometraje(null, null)).toBe(esperado);
    expect(umbralSaltoKilometraje(0, 10)).toBe(esperado);
  });
});
