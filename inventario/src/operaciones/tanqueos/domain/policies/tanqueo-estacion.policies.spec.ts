import { BadInputError } from '@common/domain/errors';
import { UnidadMedidaCombustible } from '../enums';
import {
  MAX_KILOMETRAJE,
  isValorPagadoFueraDeRangoAlerta,
  validateCantidadCombustibleRegistro,
  validateKilometrajeTanqueo,
  validateTanqueoItemEstacion,
  validateValorPagadoPositivo,
} from './tanqueo-estacion.policies';

describe('tanqueo-estacion.policies', () => {
  describe('validateKilometrajeTanqueo', () => {
    it('permite null/undefined (odómetro dañado)', () => {
      expect(() => validateKilometrajeTanqueo(null)).not.toThrow();
      expect(() => validateKilometrajeTanqueo(undefined)).not.toThrow();
    });

    it('rechaza cero, negativos y no enteros', () => {
      expect(() => validateKilometrajeTanqueo(0)).toThrow(BadInputError);
      expect(() => validateKilometrajeTanqueo(-1)).toThrow(BadInputError);
      expect(() => validateKilometrajeTanqueo(12.5)).toThrow(BadInputError);
    });

    it('rechaza por encima del máximo', () => {
      expect(() => validateKilometrajeTanqueo(MAX_KILOMETRAJE + 1)).toThrow(BadInputError);
    });

    it('acepta el rango válido inclusive límites', () => {
      expect(() => validateKilometrajeTanqueo(1)).not.toThrow();
      expect(() => validateKilometrajeTanqueo(MAX_KILOMETRAJE)).not.toThrow();
    });
  });

  describe('validateValorPagadoPositivo', () => {
    it('rechaza cero, negativo y no finito', () => {
      expect(() => validateValorPagadoPositivo(0)).toThrow(BadInputError);
      expect(() => validateValorPagadoPositivo(-5)).toThrow(BadInputError);
      expect(() => validateValorPagadoPositivo(NaN)).toThrow(BadInputError);
    });

    it('acepta valor positivo', () => {
      expect(() => validateValorPagadoPositivo(1000)).not.toThrow();
    });
  });

  describe('isValorPagadoFueraDeRangoAlerta', () => {
    it('marca fuera de rango por debajo del mínimo y por encima del máximo', () => {
      expect(isValorPagadoFueraDeRangoAlerta(3_999)).toBe(true);
      expect(isValorPagadoFueraDeRangoAlerta(10_000_001)).toBe(true);
    });

    it('no marca en rango', () => {
      expect(isValorPagadoFueraDeRangoAlerta(4_000)).toBe(false);
      expect(isValorPagadoFueraDeRangoAlerta(500_000)).toBe(false);
      expect(isValorPagadoFueraDeRangoAlerta(10_000_000)).toBe(false);
    });
  });

  describe('validateCantidadCombustibleRegistro', () => {
    it('rechaza null/undefined', () => {
      expect(() => validateCantidadCombustibleRegistro(null)).toThrow(BadInputError);
      expect(() => validateCantidadCombustibleRegistro(undefined)).toThrow(BadInputError);
    });

    it('rechaza cero y negativos', () => {
      expect(() => validateCantidadCombustibleRegistro(0)).toThrow(BadInputError);
      expect(() => validateCantidadCombustibleRegistro(-1)).toThrow(BadInputError);
    });

    it('acepta positivo', () => {
      expect(() => validateCantidadCombustibleRegistro(10)).not.toThrow();
    });
  });

  describe('validateTanqueoItemEstacion', () => {
    const base = {
      estacionServicioId: 1,
      valorTotalPagado: 50_000,
      cantidadCombustible: 10,
      unidadMedidaCombustible: UnidadMedidaCombustible.GALONES,
      kilometraje: 1000,
      requiresKilometraje: true,
    };

    it('exige estación, valor, unidad y km', () => {
      expect(() => validateTanqueoItemEstacion({ ...base, estacionServicioId: null })).toThrow(BadInputError);
      expect(() => validateTanqueoItemEstacion({ ...base, valorTotalPagado: null })).toThrow(BadInputError);
      expect(() => validateTanqueoItemEstacion({ ...base, unidadMedidaCombustible: 'X' })).toThrow(BadInputError);
      expect(() => validateTanqueoItemEstacion({ ...base, kilometraje: null })).toThrow(BadInputError);
    });

    it('no exige km cuando requiresKilometraje es false', () => {
      expect(() =>
        validateTanqueoItemEstacion({ ...base, kilometraje: null, requiresKilometraje: false })
      ).not.toThrow();
    });

    it('acepta un item válido', () => {
      expect(() => validateTanqueoItemEstacion(base)).not.toThrow();
    });
  });
});
