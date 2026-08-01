import { TipoRotulo } from '../types';
import { validarHorariosSolucion } from './validar-horarios-solucion.util';

describe('validarHorariosSolucion', () => {
  it('permite finalizaciones del día siguiente porque solo ordena preparación e inicio', () => {
    expect(() => validarHorariosSolucion(TipoRotulo.Solucion, '09:30', '10:00')).not.toThrow();
  });

  it('permite omitir preparación porque dejó de ser obligatoria', () => {
    expect(() => validarHorariosSolucion(TipoRotulo.Solucion, undefined, '10:00')).not.toThrow();
  });

  it('rechaza preparación posterior al inicio', () => {
    expect(() => validarHorariosSolucion(TipoRotulo.Solucion, '10:30', '10:00')).toThrow();
  });

  it('no aplica reglas de solución a medicamentos', () => {
    expect(() => validarHorariosSolucion(TipoRotulo.Medicamento)).not.toThrow();
  });
});
