import { NoAplicaAcuerdo, RespuestaEntregaItem } from '../enums';
import { resolveNoAplicaAcuerdo } from './no-aplica-acuerdo.policy';

describe('no-aplica-acuerdo.policy', () => {
  it('ambas declaraciones NO_APLICA → ACORDADO', () => {
    expect(
      resolveNoAplicaAcuerdo(RespuestaEntregaItem.NO_APLICA, RespuestaEntregaItem.NO_APLICA),
    ).toBe(NoAplicaAcuerdo.ACORDADO);
  });

  it('solo entrega NO_APLICA → SIN_ACUERDO', () => {
    expect(resolveNoAplicaAcuerdo(RespuestaEntregaItem.NO_APLICA, RespuestaEntregaItem.SI)).toBe(
      NoAplicaAcuerdo.SIN_ACUERDO,
    );
  });

  it('solo recepción NO_APLICA → SIN_ACUERDO', () => {
    expect(resolveNoAplicaAcuerdo(RespuestaEntregaItem.SI, RespuestaEntregaItem.NO_APLICA)).toBe(
      NoAplicaAcuerdo.SIN_ACUERDO,
    );
  });

  it('ninguna NO_APLICA → null', () => {
    expect(resolveNoAplicaAcuerdo(RespuestaEntregaItem.SI, RespuestaEntregaItem.NO)).toBeNull();
  });

  it('null/undefined → null', () => {
    expect(resolveNoAplicaAcuerdo(null, undefined)).toBeNull();
    expect(resolveNoAplicaAcuerdo()).toBeNull();
  });
});
