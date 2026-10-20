import { SocrataClient } from './socrata.client';
const fuente = { id: 'vigentes', nombre: 'Vigentes', dataset: 'i7cb-raxc' };
const row = {
  producto: 'CARDIK',
  registrosanitario: 'INVIMA 2023M-0013598-R2',
  expedientecum: '20048021',
  consecutivocum: '41',
  estadoregistro: 'Vigente',
  estadocum: 'Inactivo',
};
describe('Cliente Socrata', () => {
  const original = global.fetch;
  afterEach(() => {
    global.fetch = original;
    jest.useRealTimers();
  });
  it('pagina con orden estable, codifica filtros una vez y conserva fechas', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify(
          Array.from({ length: 21 }, (_, i) => ({
            ...row,
            consecutivocum: String(i),
            fechavencimiento: '01/01/3000',
          }))
        )
      )
    );
    global.fetch = fetchMock;
    const page = await new SocrataClient().pagina(fuente, "contains(producto, '100%')", 20);
    expect(page.candidatos).toHaveLength(20);
    expect(page.hayMas).toBe(true);
    expect(page.candidatos[0].fechaVencimiento).toBe('01/01/3000');
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.get('$offset')).toBe('20');
    expect(url.searchParams.get('$where')).toBe("contains(producto, '100%')");
    expect(url.searchParams.get('$select')).toMatch(/^distinct /);
    expect(url.searchParams.get('$order')).toContain('descripcioncomercial');
  });
  it.each([429, 503])('reintenta una sola vez ante HTTP %s', async status => {
    jest.useFakeTimers();
    const mock = jest
      .fn()
      .mockResolvedValueOnce(new Response('', { status }))
      .mockResolvedValueOnce(new Response('[]'));
    global.fetch = mock;
    const result = new SocrataClient().pagina(fuente, 'true', 0);
    await jest.runAllTimersAsync();
    expect((await result).candidatos).toEqual([]);
    expect(mock).toHaveBeenCalledTimes(2);
  });
  it('un timeout termina como error y no como lista vacía', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockRejectedValue(new Error('Timeout'));
    const promise = new SocrataClient().consultar(fuente, 'NOMBRE', 'true');
    await jest.runAllTimersAsync();
    const consulta = await promise;
    expect(consulta.error).toBe('Timeout');
    expect(consulta.paginas).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  it('un cambio de esquema produce cobertura incompleta', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ rowsUpdatedAt: 1000, columns: [] })));
    const consulta = await new SocrataClient().consultar(fuente, 'NOMBRE', 'true');
    expect(consulta.error).toContain('estructura');
    expect(consulta.paginas).toEqual([]);
  });
  it('rechaza una respuesta inesperada de la API', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('[{}]'));
    await expect(new SocrataClient().pagina(fuente, 'true', 0)).rejects.toThrow(
      'estructura inesperada'
    );
  });
});
