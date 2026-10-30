import { waitContextsReady } from './wait-data-sources.helper';

const ready = { isInitialized: true };
const pending = { isInitialized: false };

jest.mock('@common/infrastructure/services', () => ({
  switchConn: (ctx: { getCode: () => string }) =>
    ctx.getCode() === 'OK' ? ready : pending,
}));

const ctx = (code: string) => ({ getCode: () => code }) as never;

describe('waitContextsReady', () => {
  it('resuelve cuando todos están inicializados', async () => {
    await expect(waitContextsReady([ctx('OK')], 200)).resolves.toBeUndefined();
  });

  it('lanza si el timeout vence con alguno pendiente', async () => {
    await expect(waitContextsReady([ctx('OK'), ctx('NO')], 300)).rejects.toThrow(
      /DataSources no listos: NO/,
    );
  });
});
