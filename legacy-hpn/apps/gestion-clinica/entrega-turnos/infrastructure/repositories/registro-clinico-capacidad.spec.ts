import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { validarCapacidadRegistro } from './registro-clinico-capacidad';

const columnas = [
  'DIAGNOSTICO',
  'REPORTELAB',
  'REPORTEIMG',
  'PENDIENTES',
  'TRATAMIENTO',
  'ESPECIALIDADTRATANTE',
];
function manager(maxBytes = -1, bytesRequeridos = 8000) {
  return {
    connection: { getMetadata: jest.fn(() => ({ tablePath: 'REGISTROCLINICO' })) },
    query: jest
      .fn()
      .mockResolvedValue(
        columnas.map(columna => ({ columna, tipo: 'nvarchar', maxBytes, bytesRequeridos }))
      ),
  };
}
describe('Capacidad real del registro clínico', () => {
  it('acepta texto con formato en columnas max y parametriza todo el contenido', async () => {
    const m = manager();
    await validarCapacidadRegistro(m as unknown as EntityManager, {
      diagnostico: '<div data-gcm-clinical="1"><p><u>Texto</u></p></div>',
    });
    expect(m.query).toHaveBeenCalledWith(expect.stringContaining('sys.columns'), [
      'REGISTROCLINICO',
      '<div data-gcm-clinical="1"><p><u>Texto</u></p></div>',
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(m.query.mock.calls[0][0]).toContain('DATALENGTH');
  });
  it('rechaza antes del guardado contenido que supera una columna limitada', async () => {
    const m = manager(4000, 4002);
    await expect(
      validarCapacidadRegistro(m as unknown as EntityManager, { diagnostico: 'texto' })
    ).rejects.toThrow('Diagnósticos supera la capacidad');
  });
  it('acepta contenido en el límite exacto', async () => {
    const m = manager(4000, 4000);
    await expect(
      validarCapacidadRegistro(m as unknown as EntityManager, { diagnostico: 'texto' })
    ).resolves.toBeUndefined();
  });
  it('no guarda si no se pueden comprobar todas las columnas', async () => {
    const m = manager();
    m.query.mockResolvedValue([]);
    await expect(
      validarCapacidadRegistro(m as unknown as EntityManager, {})
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
