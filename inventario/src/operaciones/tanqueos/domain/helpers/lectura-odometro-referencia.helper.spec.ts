import { FuenteLecturaOdometro } from '../enums';
import { seleccionarKmConfiableAntesDelTanqueo } from './lectura-odometro-referencia.helper';

describe('seleccionarKmConfiableAntesDelTanqueo', () => {
  const fechaTanqueo = new Date('2026-03-01T12:00:00Z');

  it('omite la lectura más reciente si no es confiable y usa la anterior confiable', () => {
    const km = seleccionarKmConfiableAntesDelTanqueo(
      [
        {
          id: 2,
          lectura: 9000,
          fechaLectura: new Date('2026-02-28T10:00:00Z'),
          confiable: false,
          fuente: FuenteLecturaOdometro.TANQUEO,
          referenciaId: 50,
        },
        {
          id: 1,
          lectura: 8500,
          fechaLectura: new Date('2026-02-20T10:00:00Z'),
          confiable: true,
          fuente: FuenteLecturaOdometro.TANQUEO,
          referenciaId: 40,
        },
      ],
      fechaTanqueo,
      100
    );
    expect(km).toBe(8500);
  });
});
