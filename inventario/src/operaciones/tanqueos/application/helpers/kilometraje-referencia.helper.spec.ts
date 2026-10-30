import { resolveKilometrajeReferenciaKm } from './kilometraje-referencia.helper';

describe('resolveKilometrajeReferenciaKm', () => {
  it('toma el mayor entre el km del activo y el último tanqueo', () => {
    expect(resolveKilometrajeReferenciaKm(9000, 8500)).toBe(9000);
    expect(resolveKilometrajeReferenciaKm(8000, 8500)).toBe(8500);
  });

  it('ignora valores nulos, undefined o NaN', () => {
    expect(resolveKilometrajeReferenciaKm(null, 8500)).toBe(8500);
    expect(resolveKilometrajeReferenciaKm(9000, null)).toBe(9000);
    expect(resolveKilometrajeReferenciaKm(undefined, undefined)).toBeNull();
    expect(resolveKilometrajeReferenciaKm(NaN, 100)).toBe(100);
    expect(resolveKilometrajeReferenciaKm(null, null)).toBeNull();
  });
});
