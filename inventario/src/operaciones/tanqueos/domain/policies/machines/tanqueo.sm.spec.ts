import { BadInputError } from '@common/domain/errors';
import { EstadoTanqueo } from '../../enums/estados.enum';
import {
  assertTanqueoMarkReviewed,
  assertTanqueoTransitionState,
  canTanqueoMarkReviewed,
  canTanqueoTransitionState,
  tanqueoInitialState,
} from './tanqueo.sm';

describe('tanqueo.sm', () => {
  const estados = [
    EstadoTanqueo.VALIDADO_AUTOMATICAMENTE,
    EstadoTanqueo.APTO_PARA_REVISION,
    EstadoTanqueo.VALIDADO_MANUALMENTE,
    EstadoTanqueo.ANULADO,
  ];

  describe('canTanqueoTransitionState', () => {
    it('APTO_PARA_REVISION solo transiciona a VALIDADO_MANUALMENTE o ANULADO', () => {
      expect(
        canTanqueoTransitionState(
          EstadoTanqueo.APTO_PARA_REVISION,
          EstadoTanqueo.VALIDADO_MANUALMENTE
        )
      ).toBe(true);
      expect(
        canTanqueoTransitionState(EstadoTanqueo.APTO_PARA_REVISION, EstadoTanqueo.ANULADO)
      ).toBe(true);
      expect(
        canTanqueoTransitionState(
          EstadoTanqueo.APTO_PARA_REVISION,
          EstadoTanqueo.VALIDADO_AUTOMATICAMENTE
        )
      ).toBe(false);
    });

    it('VALIDADO_AUTOMATICAMENTE transiciona a ANULADO o VALIDADO_MANUALMENTE', () => {
      expect(
        canTanqueoTransitionState(
          EstadoTanqueo.VALIDADO_AUTOMATICAMENTE,
          EstadoTanqueo.ANULADO
        )
      ).toBe(true);
      expect(
        canTanqueoTransitionState(
          EstadoTanqueo.VALIDADO_AUTOMATICAMENTE,
          EstadoTanqueo.VALIDADO_MANUALMENTE
        )
      ).toBe(true);
    });

    it('VALIDADO_MANUALMENTE transiciona a ANULADO o APTO_PARA_REVISION', () => {
      expect(
        canTanqueoTransitionState(
          EstadoTanqueo.VALIDADO_MANUALMENTE,
          EstadoTanqueo.ANULADO
        )
      ).toBe(true);
      expect(
        canTanqueoTransitionState(
          EstadoTanqueo.VALIDADO_MANUALMENTE,
          EstadoTanqueo.APTO_PARA_REVISION
        )
      ).toBe(true);
    });

    it('ANULADO es terminal (no transiciona a ningún estado)', () => {
      for (const to of estados) {
        expect(canTanqueoTransitionState(EstadoTanqueo.ANULADO, to)).toBe(false);
      }
    });
  });

  describe('assertTanqueoTransitionState', () => {
    it('no lanza en transición permitida', () => {
      expect(() =>
        assertTanqueoTransitionState(
          EstadoTanqueo.VALIDADO_AUTOMATICAMENTE,
          EstadoTanqueo.VALIDADO_MANUALMENTE
        )
      ).not.toThrow();
    });

    it('lanza BadInputError en transición no permitida', () => {
      expect(() =>
        assertTanqueoTransitionState(
          EstadoTanqueo.ANULADO,
          EstadoTanqueo.VALIDADO_MANUALMENTE
        )
      ).toThrow(BadInputError);
    });
  });

  describe('tanqueoInitialState', () => {
    it('devuelve APTO_PARA_REVISION cuando hay inconsistencia crítica abierta', () => {
      expect(tanqueoInitialState(true)).toBe(EstadoTanqueo.APTO_PARA_REVISION);
    });

    it('devuelve VALIDADO_AUTOMATICAMENTE cuando no hay críticas', () => {
      expect(tanqueoInitialState(false)).toBe(EstadoTanqueo.VALIDADO_AUTOMATICAMENTE);
    });
  });

  describe('markReviewed', () => {
    it('solo VALIDADO_AUTOMATICAMENTE puede marcarse como revisado', () => {
      expect(canTanqueoMarkReviewed(EstadoTanqueo.VALIDADO_AUTOMATICAMENTE)).toBe(true);
      expect(canTanqueoMarkReviewed(EstadoTanqueo.APTO_PARA_REVISION)).toBe(false);
      expect(canTanqueoMarkReviewed(EstadoTanqueo.VALIDADO_MANUALMENTE)).toBe(false);
      expect(canTanqueoMarkReviewed(EstadoTanqueo.ANULADO)).toBe(false);
    });

    it('assertTanqueoMarkReviewed lanza si el estado no es VALIDADO_AUTOMATICAMENTE', () => {
      expect(() => assertTanqueoMarkReviewed(EstadoTanqueo.APTO_PARA_REVISION)).toThrow(
        BadInputError
      );
      expect(() => assertTanqueoMarkReviewed(EstadoTanqueo.VALIDADO_AUTOMATICAMENTE)).not.toThrow();
    });
  });
});
