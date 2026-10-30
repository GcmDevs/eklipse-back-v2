import { FiltroEstadoInconsistenciaBandeja } from '../enums/inconsistencia-bandeja.enum';
import { EstadoInconsistencia } from '../enums/estados.enum';
import { estadoInconsistenciaParaBandeja } from './inconsistencia-bandeja-estado.helper';

describe('estadoInconsistenciaParaBandeja', () => {
  it('por defecto solo ABIERTA', () => {
    expect(estadoInconsistenciaParaBandeja()).toBe(EstadoInconsistencia.ABIERTA);
    expect(estadoInconsistenciaParaBandeja(FiltroEstadoInconsistenciaBandeja.ABIERTA)).toBe(
      EstadoInconsistencia.ABIERTA
    );
  });

  it('TODAS no filtra por estado', () => {
    expect(estadoInconsistenciaParaBandeja(FiltroEstadoInconsistenciaBandeja.TODAS)).toBeNull();
  });

  it('CERRADA filtra cerradas', () => {
    expect(estadoInconsistenciaParaBandeja(FiltroEstadoInconsistenciaBandeja.CERRADA)).toBe(
      EstadoInconsistencia.CERRADA
    );
  });
});
