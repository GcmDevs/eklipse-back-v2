import { QueryRunner } from 'typeorm';
import { GCM_CONTEXTS } from '@common/domain/types';
import { bloquearDietas } from './bloqueo-dietas';

describe('bloquearDietas', () => {
  const fecha = new Date('2026-11-04T00:00:00.000Z');

  it.each([0, 1])('acepta el bloqueo obtenido con resultado %i', async resultado => {
    const query = jest.fn().mockResolvedValue([{ resultado }]);
    await bloquearDietas({ query } as unknown as QueryRunner, GCM_CONTEXTS.ALTACENTRO, fecha);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("@LockOwner = 'Transaction'"), [
      'dietas:ALTACENTRO:2026-11-04',
    ]);
  });

  it.each([-1, -2, -3, -999])('impide escribir si SQL devuelve %i', async resultado => {
    const query = jest.fn().mockResolvedValue([{ resultado }]);
    await expect(
      bloquearDietas({ query } as unknown as QueryRunner, GCM_CONTEXTS.AGUACHICA, fecha)
    ).rejects.toThrow('bloqueo');
  });

  it('no considera exitoso un resultado ausente', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await expect(
      bloquearDietas({ query } as unknown as QueryRunner, GCM_CONTEXTS.SANJUAN, fecha)
    ).rejects.toThrow('bloqueo');
  });
});
