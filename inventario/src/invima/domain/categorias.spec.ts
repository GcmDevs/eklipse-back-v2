import { GRUPOS_REGISTROS, TIPOS_PRODUCTO_INVIMA, TipoProductoInvima } from './invima.models';
import { construirFiltro, evaluarCoincidencias } from './comparacion';
import { fuentesInvima, SocrataClient } from '../infrastructure/socrata.client';

const fuente = fuentesInvima('ALIMENTOS')[0];
const campos = [
  'expediente',
  'producto',
  'rsynso',
  'estadoregistro',
  'titular',
  'grupo',
  'fechaexpedicion',
  'fechavencimiento',
];
const registro = {
  expediente: '0001',
  producto: 'ALIMENTO',
  rsynso: 'RSA-123',
  estadoregistro: 'Vigente',
  grupo: 'ALIMENTOS',
  fechaexpedicion: '1900-01-01T00:00:00.000',
};
const meta = { rowsUpdatedAt: 1000, columns: campos.map(fieldName => ({ fieldName })) };
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

describe('Categorías y fuente RS/NSO', () => {
  it('conserva cuatro fuentes CUM y dispositivos históricos y ofrece solo los 15 grupos de producto', () => {
    expect(fuentesInvima().map(f => f.id)).toEqual(['vigentes', 'vencidos', 'renovacion', 'otros']);
    expect(fuentesInvima('MEDICAMENTO')).toEqual(fuentesInvima());
    expect(fuentesInvima('DISPOSITIVO')[0].id).toBe('dispositivos');
    expect(fuentesInvima('SIN_CLASIFICAR')).toEqual([]);
    expect(fuentesInvima('VITAL_NO_DISPONIBLE')).toEqual([]);
    expect(Object.keys(GRUPOS_REGISTROS)).toHaveLength(14);
    expect(TIPOS_PRODUCTO_INVIMA).toHaveLength(18);
    expect(Object.values(GRUPOS_REGISTROS)).not.toContain('OPERACIONES');
    expect(Object.values(GRUPOS_REGISTROS)).not.toContain('RADIOFARMACOS');
  });
  it.each(Object.entries(GRUPOS_REGISTROS))(
    'construye registro y nombre en el grupo de %s',
    (tipo, grupo) => {
      const input = {
        tipo: tipo as TipoProductoInvima,
        nombre: "Producto O'Brien 100%",
        registroSanitario: 'INVIMA RSA-123',
      };
      expect(fuentesInvima(input.tipo)[0]).toMatchObject({ id: 'registros', grupo });
      for (const criterio of ['REGISTRO', 'NOMBRE'] as const) {
        const where = construirFiltro(input, criterio);
        expect(where).toContain(`grupo = '${grupo}' AND (`);
        expect(where).toContain(criterio === 'REGISTRO' ? 'upper(rsynso)' : "O''Brien");
      }
      expect(() => construirFiltro(input, 'CUM')).toThrow('no se consulta por CUM');
      expect(
        evaluarCoincidencias(
          { ...input, cum: '1-1' },
          [{ cum: '1-1', registroSanitario: 'RSA-123' } as any],
          'CUM',
          true
        ).resultado
      ).not.toBe('EXACTA');
    }
  );
  it('mapea datos publicados y pagina sin campos CUM ni presentaciones inventadas', async () => {
    global.fetch = jest.fn(
      async () =>
        new Response(
          JSON.stringify(
            Array.from({ length: 21 }, (_, i) => ({ ...registro, expediente: String(i) }))
          )
        )
    ) as any;
    const page = await new SocrataClient().pagina(fuente, 'true OR true', 20);
    expect(page.hayMas).toBe(true);
    expect(page.candidatos).toHaveLength(20);
    expect(page.candidatos[0]).toMatchObject({
      fuenteId: 'registros',
      grupo: 'ALIMENTOS',
      expediente: '0',
      registroSanitario: 'RSA-123',
      cum: null,
      estadoCum: null,
      presentacion: '',
      formaFarmaceutica: '',
      fechaExpedicion: registro.fechaexpedicion,
      fechaVencimiento: '',
    });
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(url.searchParams.get('$where')).toBe("grupo = 'ALIMENTOS' AND (true OR true)");
    expect(url.searchParams.get('$order')).toBe(campos.join(','));
    expect(url.searchParams.get('$offset')).toBe('20');
  });
  it('rechaza consultar sin grupo o recibir candidatos de otro grupo', async () => {
    const client = new SocrataClient();
    await expect(client.pagina({ ...fuente, grupo: undefined }, 'true', 0)).rejects.toThrow(
      'grupo'
    );
    global.fetch = jest.fn(
      async () => new Response(JSON.stringify([{ ...registro, grupo: 'COSMETICOS' }]))
    ) as any;
    await expect(client.pagina(fuente, 'true', 0)).rejects.toThrow('estructura inesperada');
  });
  it('valida metadatos y grupos, reutiliza la caché por dataset sin omitir la categoría', async () => {
    const mock = jest.fn(
      async (url: URL) =>
        new Response(
          JSON.stringify(
            url.pathname.includes('/api/views/')
              ? meta
              : [{ grupo: 'ALIMENTOS' }, { grupo: 'MEDICO QUIRURGICOS' }]
          )
        )
    );
    global.fetch = mock as any;
    const client = new SocrataClient();
    expect(await client.validarFuente(fuente)).toBe(1000);
    expect(await client.validarFuente(fuentesInvima('MEDICO_QUIRURGICOS')[0])).toBe(1000);
    await expect(client.validarFuente(fuentesInvima('COSMETICOS')[0])).rejects.toThrow(
      'no está publicado'
    );
    expect(mock).toHaveBeenCalledTimes(2);
  });
  it('un grupo ausente o cambio de esquema es cobertura incompleta, no ausencia de coincidencias', async () => {
    for (const schema of [meta, { ...meta, columns: [] }]) {
      global.fetch = jest.fn(
        async (url: URL) =>
          new Response(
            JSON.stringify(
              url.pathname.includes('/api/views/') ? schema : [{ grupo: 'COSMETICOS' }]
            )
          )
      ) as any;
      const consulta = await new SocrataClient().consultar(fuente, 'NOMBRE', 'true');
      expect(consulta.error).toBeTruthy();
      expect(consulta.paginas).toEqual([]);
    }
  });
});
