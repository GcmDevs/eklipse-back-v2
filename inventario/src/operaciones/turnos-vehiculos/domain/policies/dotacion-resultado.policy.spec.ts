import { EstadoDotacion } from '../enums';
import { borradorDescartadoDotacion, mapDotacionResultado } from './dotacion-resultado.policy';

describe('mapDotacionResultado', () => {
  it('EN_CURSO → EN_CURSO', () => {
    expect(mapDotacionResultado(EstadoDotacion.EN_CURSO)).toBe('EN_CURSO');
  });

  it('CERRADA completa → COMPLETA', () => {
    expect(mapDotacionResultado(EstadoDotacion.CERRADA, true, false, new Date())).toBe('COMPLETA');
  });

  it('CERRADA incompleta manual → INCOMPLETA_MANUAL', () => {
    expect(mapDotacionResultado(EstadoDotacion.CERRADA, false, false, new Date())).toBe('INCOMPLETA_MANUAL');
  });

  it('vencida sin cierre previo → INCOMPLETA_VENCIDA', () => {
    expect(mapDotacionResultado(EstadoDotacion.CERRADA, false, true, null)).toBe('INCOMPLETA_VENCIDA');
  });

  it('vencida con cierre previo conserva COMPLETA/INCOMPLETA_MANUAL', () => {
    expect(mapDotacionResultado(EstadoDotacion.CERRADA, true, true, new Date())).toBe('COMPLETA');
    expect(mapDotacionResultado(EstadoDotacion.CERRADA, false, true, new Date())).toBe('INCOMPLETA_MANUAL');
  });

  it('borradorDescartado solo si cierre automático y hay fechaUltimoCierre', () => {
    expect(borradorDescartadoDotacion(true, new Date())).toBe(true);
    expect(borradorDescartadoDotacion(true, null)).toBe(false);
    expect(borradorDescartadoDotacion(false, new Date())).toBe(false);
  });
});
