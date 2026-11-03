import { extraerPedidoDisfarma, HojaPedido } from './pedido-excel.extractor';
const hoja = (rows: string[][]): HojaPedido => ({
  nombre: 'DetallePedido',
  filas: [
    ['ELABORADO POR: AM MEDICAL SAS'],
    ['FECHA EXPEDICIÓN DCTO: 19/10/2026'],
    ['PEDIDO NO. 1081272'],
    ['Código', 'Descripción', 'Fecha Vence', 'CUM', 'INVIMA', 'Cantidad'],
    ...rows,
  ].map((r, i) => ({ numero: i + 1, celdas: r.map(texto => ({ texto })) })),
});
describe('Pedido Excel Disfarma', () => {
  it('distingue cliente y pedido de un proveedor y conserva cada renglón con evidencia', () => {
    const r = extraerPedidoDisfarma([
      hoja([
        ['100', 'PRODUCTO A', '02N1C2', '000123-001', '2021M-006528-R4', '0'],
        ['100', 'PRODUCTO A', '03N1C2', '000123-001', '2021M-006528-R4', '0'],
        ['-DESCUENTO:', '', '', '', '', ''],
      ]),
    ]);
    expect(r).toMatchObject({
      tipoDocumento: 'PEDIDO',
      cliente: 'Disfarma',
      proveedor: '',
      numero: '1081272',
      fecha: '2026-10-19',
      paginas: 0,
    });
    expect(r.renglones).toHaveLength(2);
    expect(r.renglones[0]).toMatchObject({
      tipo: 'MEDICAMENTO',
      cantidad: 0,
      codigoDeclarado: '000123-001',
      hoja: 'DetallePedido',
      fila: 5,
      paginas: [],
    });
    expect(r.renglones[0].advertencias.join(' ')).toContain('CUM repetido');
    expect(r.renglones[0].fragmento).toContain('Fecha Vence: 02N1C2');
  });
  it('mantiene vacíos y N.A. para corrección y no convierte códigos internos ni fechas en CUM', () => {
    const r = extraerPedidoDisfarma([
      hoja([
        ['123', 'PRODUCTO SIN DATOS', '02N1C2', '', '', '0'],
        ['456', 'PRODUCTO NA', '', 'N.A.', '', '0'],
        ['789', '', '', '00012-01', '2020M- 0123 R1', '0'],
      ]),
    ]);
    expect(r.renglones).toHaveLength(3);
    expect(r.renglones[0]).toMatchObject({ codigoDeclarado: '', tipo: 'SIN_CLASIFICAR' });
    expect(r.renglones[1].codigoDeclarado).toBe('N.A.');
    expect(r.renglones[2]).toMatchObject({ descripcion: '', registroSanitario: '2020M- 0123 R1' });
    expect(r.renglones[2].advertencias.join(' ')).toContain('espacios');
  });
  it('no usa fórmulas de identificadores ni interpreta una fecha inválida', () => {
    const h = hoja([['1', 'Producto', '', '0001-01', '2020DM-123', '0']]);
    h.filas[1].celdas[0].texto = 'FECHA EXPEDICIÓN DCTO: 31/02/2026';
    h.filas[4].celdas[3].formula = true;
    const r = extraerPedidoDisfarma([h]);
    expect(r.fecha).toBeNull();
    expect(r.renglones[0]).toMatchObject({ tipo: 'DISPOSITIVO', codigoDeclarado: '' });
    expect(r.renglones[0].advertencias.join(' ')).toContain('fórmulas');
  });
  it('rechaza hojas ambiguas, formato desconocido y textos que no caben sin truncarlos', () => {
    const h = hoja([['1', 'X'.repeat(241), '', '1-1', '', '0']]);
    expect(() => extraerPedidoDisfarma([h])).toThrow('longitud');
    expect(() => extraerPedidoDisfarma([h, h])).toThrow('varias hojas');
    expect(() => extraerPedidoDisfarma([])).toThrow('columnas');
  });
  it('lee la factura original con NOMBRE_PRODUCTO, unidades y presentaciones sin convertir totales en productos', () => {
    const h: HojaPedido = {
      nombre: 'DetalleFactura',
      filas: [
        { numero: 1, celdas: [{ texto: 'FECHA EXPEDICIÓN DCTO: 30/09/2026' }] },
        { numero: 2, celdas: [{ texto: 'FACTURA ZD NO. 753889' }] },
        {
          numero: 3,
          celdas: [
            'PRODUCTO',
            'NOMBRE_PRODUCTO',
            'CANTIDAD_PRESENTACION',
            'CANTIDAD_UNIDADES',
            'CUM',
            'INVIMA',
          ].map(texto => ({ texto })),
        },
        {
          numero: 4,
          celdas: [
            { texto: '319184' },
            { texto: 'AMOKEM CV' },
            { texto: '3', numero: 3 },
            { texto: '42', numero: 42 },
            { texto: '00020192258-01' },
            { texto: '2021M-0020426' },
          ],
        },
        { numero: 5, celdas: [{ texto: 'TOTAL:' }, { texto: 'TOTAL:' }] },
      ],
    };
    const r = extraerPedidoDisfarma([h]);
    expect(r).toMatchObject({
      tipoDocumento: 'FACTURA',
      numero: 'ZD 753889',
      proveedor: 'Disfarma',
      cliente: '',
      extractorVersion: '3',
      fecha: '2026-09-30',
    });
    expect(r.renglones).toHaveLength(1);
    expect(r.renglones[0]).toMatchObject({
      descripcion: 'AMOKEM CV',
      codigoDeclarado: '00020192258-01',
      cantidad: 42,
      cantidadPresentacion: 3,
    });
    expect(r.renglones[0].fragmento).toContain('CANTIDAD_UNIDADES: 42');
  });
  it('conserva cero, decimales y vacío sin usar fórmulas ni cantidades ambiguas', () => {
    const h = hoja([
      ['1', 'Producto cero', '', '', '', '0'],
      ['2', 'Producto decimal', '', '', '', '1,5'],
      ['3', 'Producto vacío', '', '', '', ''],
      ['4', 'Producto inválido', '', '', '', '-2'],
      ['5', 'Producto ambiguo', '', '', '', '1.000'],
      ['6', 'Producto fórmula', '', '', '', 'A1*2'],
    ]);
    h.filas[9].celdas[5].formula = true;
    const r = extraerPedidoDisfarma([h]);
    expect(r.renglones.map(row => row.cantidad)).toEqual([0, 1.5, null, null, null, null]);
    for (const row of r.renglones.slice(3))
      expect(row.advertencias.join(' ')).toContain('Cantidad inválida');
    expect(r.renglones[0].cantidadPresentacion).toBeUndefined();
  });
});
