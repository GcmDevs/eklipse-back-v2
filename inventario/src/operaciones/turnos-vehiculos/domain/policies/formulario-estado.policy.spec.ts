import { CausaCierreDeclaracion, CausaCierreLimpieza, EstadoDeclaracion, EstadoDotacion, EstadoLimpieza, ModalidadDeclaracion } from '../enums';
import {
  estadoDeclaracionVisible,
  estadoDotacionVisible,
  estadoLimpiezaVisible,
} from './formulario-estado.policy';

describe('estadoLimpiezaVisible', () => {
  it('sin filas → NO_INICIADO', () => {
    expect(estadoLimpiezaVisible([])).toEqual({ estado: 'NO_INICIADO' });
  });

  it('borrador → EN_CURSO', () => {
    expect(estadoLimpiezaVisible([{ estado: EstadoLimpieza.BORRADOR }])).toEqual({ estado: 'EN_CURSO' });
  });

  it('incompleto por vencimiento → VENCIDO_SIN_CERRAR', () => {
    expect(
      estadoLimpiezaVisible([
        { estado: EstadoLimpieza.INCOMPLETO, causaCierre: CausaCierreLimpieza.VENCIMIENTO },
      ]),
    ).toEqual({ estado: 'VENCIDO_SIN_CERRAR' });
  });
});

describe('estadoDeclaracionVisible', () => {
  it('null → null (recepción inexistente)', () => {
    expect(estadoDeclaracionVisible(null)).toBeNull();
  });

  it('existe false → NO_INICIADO', () => {
    expect(estadoDeclaracionVisible({ existe: false })).toEqual({ estado: 'NO_INICIADO' });
  });

  it('vencida vacía → SIN_DILIGENCIAR', () => {
    expect(
      estadoDeclaracionVisible({
        existe: true,
        estado: EstadoDeclaracion.CERRADA,
        modalidad: ModalidadDeclaracion.SIN_RESPUESTAS,
        causaCierre: CausaCierreDeclaracion.VENCIMIENTO,
      }),
    ).toEqual({ estado: 'SIN_DILIGENCIAR' });
  });
});

describe('estadoDotacionVisible', () => {
  it('sin fila → NO_INICIADO', () => {
    expect(estadoDotacionVisible({ existe: false })).toEqual({ estado: 'NO_INICIADO' });
  });

  it('vencida sin cierre previo → VENCIDO_SIN_CERRAR', () => {
    expect(
      estadoDotacionVisible({
        existe: true,
        estado: EstadoDotacion.CERRADA,
        cierreAutomatico: true,
        fechaUltimoCierre: null,
      }),
    ).toEqual({ estado: 'VENCIDO_SIN_CERRAR', borradorDescartado: false });
  });

  it('cierre previo + vencimiento de borrador → COMPLETO con marca', () => {
    expect(
      estadoDotacionVisible({
        existe: true,
        estado: EstadoDotacion.CERRADA,
        completa: true,
        cierreAutomatico: true,
        fechaUltimoCierre: new Date(),
      }),
    ).toEqual({ estado: 'COMPLETO', borradorDescartado: true });
  });
});
