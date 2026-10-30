import { ModalidadDeclaracion, RespuestaEntregaItem } from '../enums';
import { EntregaItemJson } from '../types';
import {
  countPendientesEntrega,
  countPendientesLimpieza,
  resolveModalidadEntrega,
} from './declaracion-modalidad.policy';

const item = (respuesta: RespuestaEntregaItem | string): EntregaItemJson => ({
  key: 'it_1',
  respuesta,
});

describe('declaracion-modalidad.policy', () => {
  it('cuenta como pendientes los SIN_REPORTAR (enum y string)', () => {
    expect(
      countPendientesEntrega([
        item(RespuestaEntregaItem.SIN_REPORTAR),
        item(RespuestaEntregaItem.SI),
        item('SIN_REPORTAR'),
      ]),
    ).toBe(2);
  });

  it('sin pendientes → COMPLETO', () => {
    expect(
      resolveModalidadEntrega([item(RespuestaEntregaItem.SI), item(RespuestaEntregaItem.NO)]),
    ).toBe(ModalidadDeclaracion.COMPLETO);
  });

  it('todos pendientes → SIN_RESPUESTAS', () => {
    expect(
      resolveModalidadEntrega([
        item(RespuestaEntregaItem.SIN_REPORTAR),
        item(RespuestaEntregaItem.SIN_REPORTAR),
      ]),
    ).toBe(ModalidadDeclaracion.SIN_RESPUESTAS);
  });

  it('mixto → PARCIAL', () => {
    expect(
      resolveModalidadEntrega([item(RespuestaEntregaItem.SI), item(RespuestaEntregaItem.SIN_REPORTAR)]),
    ).toBe(ModalidadDeclaracion.PARCIAL);
  });

  it('array vacío → SIN_RESPUESTAS (comportamiento actual: 0 === 0)', () => {
    expect(resolveModalidadEntrega([])).toBe(ModalidadDeclaracion.SIN_RESPUESTAS);
  });

  it('en limpieza cuenta como pendiente el null, no el NC', () => {
    expect(
      countPendientesLimpieza([{ respuesta: null }, { respuesta: 'NC' }, { respuesta: 'C' }]),
    ).toBe(1);
  });
});
