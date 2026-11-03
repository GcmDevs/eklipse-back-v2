import {
  calcularMuestreo,
  leerInspeccion,
  normalizarInspeccion,
  InspeccionEntrada,
} from './inspeccion';

const producto = {
  tipoProductoCode: 1,
  cantidadErrores: 0,
  estadoEmbalajeCode: 1,
  verifiRegSanINVIMA: true,
  reviEtiquetaProducto: true,
  reviOrtografiaSellos: true,
  correspFabriExpediSani: true,
};
const lote = (cantidad = 8) => ({ cantidad, lote: 'H3422809', fechaVencimiento: '2027-02-05' });
const entrada = (): InspeccionEntrada => ({
  cantidadFacturada: 10,
  novedades: [],
  motivosRechazo: [],
});
describe('Inspección de recepción técnica', () => {
  it.each([
    [8, 'FALTANTE', 2],
    [12, 'SOBRANTE', 2],
    [10, null, 0],
  ] as const)(
    'facturado 10 y físico %s calcula %s %s sin rechazar por la diferencia',
    (q, tipo, cantidad) => {
      const r = normalizarInspeccion(entrada(), producto, [lote(q)], 7);
      expect(r.inspeccion.cantidadFisica).toBe(q);
      expect(r.inspeccion.novedades).toEqual(tipo ? [{ tipo, cantidad }] : []);
      expect(r.cumple).toBe(true);
      expect(leerInspeccion(JSON.stringify(r.inspeccion))).toEqual(r.inspeccion);
    }
  );
  it('mantiene varias novedades sin sumar unidades coincidentes ni confiar en faltantes enviados', () => {
    const e = entrada();
    e.novedades = [
      { tipo: 'AVERIA', cantidad: 7 },
      { tipo: 'NO_SOLICITADO', cantidad: 7 },
      { tipo: 'FALTANTE', cantidad: 999 },
    ];
    const r = normalizarInspeccion(e, producto, [lote()], 7);
    expect(r.inspeccion.novedades).toEqual([
      { tipo: 'AVERIA', cantidad: 7 },
      { tipo: 'NO_SOLICITADO', cantidad: 7 },
      { tipo: 'FALTANTE', cantidad: 2 },
    ]);
    expect(r.cumple).toBe(true);
  });
  it.each([['CUM'], ['INVIMA'], ['CUM', 'INVIMA']])(
    'rechaza todo el renglón por causas %s',
    (...motivos) => {
      const e = entrada();
      e.motivosRechazo = motivos as any;
      expect(normalizarInspeccion(e, producto, [lote()], 7).cumple).toBe(false);
    }
  );
  it('acepta cero físico sin lotes, sin simular muestreo o cumplimiento', () => {
    const r = normalizarInspeccion(entrada(), producto, [], 7);
    expect(r.muestreo).toEqual({ nivel: 'N/A', muestra: 0, cumple: false });
    expect(r.cumple).toBe(false);
    expect(r.inspeccion.novedades).toEqual([{ tipo: 'FALTANTE', cantidad: 10 }]);
  });
  it('Vital no disponible requiere IUM o resolución y evalúa solo etiqueta y sellos además de muestreo/embalaje', () => {
    const vital = {
      ...producto,
      tipoProductoCode: 4,
      verifiRegSanINVIMA: false,
      correspFabriExpediSani: false,
    };
    expect(() => normalizarInspeccion(entrada(), vital, [lote()], 7)).toThrow('IUM');
    for (const identificacion of [
      { ium: '1T1003441008100' },
      { numeroResolucion: '000123-2026' },
      { ium: '001AB', numeroResolucion: '000123' },
    ]) {
      const r = normalizarInspeccion({ ...entrada(), ...identificacion }, vital, [lote()], 7);
      expect(r.cumple).toBe(true);
      expect(r.inspeccion).toMatchObject(identificacion);
      expect(
        normalizarInspeccion(
          { ...entrada(), ...identificacion },
          { ...vital, reviEtiquetaProducto: false },
          [lote()],
          7
        ).cumple
      ).toBe(false);
    }
    expect(() =>
      normalizarInspeccion(
        { ...entrada(), ium: '000AB', motivosRechazo: ['CUM'] },
        vital,
        [lote()],
        7
      )
    ).toThrow('no aplica');
  });
  it.each([-1, NaN, Infinity, 0.00001])('rechaza cantidad facturada inválida %s', q => {
    expect(() =>
      normalizarInspeccion({ ...entrada(), cantidadFacturada: q }, producto, [lote()], 7)
    ).toThrow('cantidades');
  });
  it('rechaza novedades repetidas, excesivas o sin cantidad y lotes de datos inválidos', () => {
    for (const novedades of [
      [{ tipo: 'AVERIA', cantidad: 9 }],
      [{ tipo: 'AVERIA', cantidad: 0 }],
      [
        { tipo: 'AVERIA', cantidad: 1 },
        { tipo: 'AVERIA', cantidad: 1 },
      ],
    ])
      expect(() =>
        normalizarInspeccion({ ...entrada(), novedades: novedades as any }, producto, [lote()], 7)
      ).toThrow();
    for (const lotes of [[lote(-1)], [lote(), lote()], [{ ...lote(), fechaVencimiento: '' }]])
      expect(() => normalizarInspeccion(entrada(), producto, lotes, 7)).toThrow();
  });
  it('mantiene el rechazo por embalaje, controles sanitarios y umbral crítico', () => {
    for (const p of [
      { ...producto, estadoEmbalajeCode: 2 },
      { ...producto, verifiRegSanINVIMA: false },
      { ...producto, cantidadErrores: 1 },
    ])
      expect(normalizarInspeccion(entrada(), p, [lote()], 7).cumple).toBe(false);
  });
  it('soporta fracciones sin diferencias de coma flotante y el último rango de muestreo', () => {
    const r = normalizarInspeccion(
      { ...entrada(), cantidadFacturada: 0.3 },
      producto,
      [
        { ...lote(0.1), lote: 'A' },
        { ...lote(0.2), lote: 'B' },
      ],
      7
    );
    expect(r.inspeccion.cantidadFisica).toBe(0.3);
    expect(r.inspeccion.novedades).toEqual([]);
    expect(calcularMuestreo(26.5, 0).nivel).toBe('D');
    expect(calcularMuestreo(500001, 0).nivel).toBe('Q');
  });
});
