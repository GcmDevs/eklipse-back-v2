import { Workbook } from 'exceljs';
import { PedidoExcelService } from './pedido-excel.service';
async function excel(rows = 2) {
  const w = new Workbook();
  const h = w.addWorksheet('DetallePedido');
  h.addRow(['FECHA EXPEDICIÓN DCTO: 19/10/2026']);
  h.addRow(['PEDIDO NO. 1081272']);
  h.addRow(['Código', 'Descripción', 'Fecha Vence', 'CUM', 'INVIMA']);
  for (let i = 0; i < rows; i++)
    h.addRow([String(i + 1), 'Producto ' + i, '02N1C2', '000123-001', '2021M-006528-R4']);
  h.addRow(['-DESCUENTO:']);
  h.mergeCells(`A${h.rowCount}:E${h.rowCount}`);
  return Buffer.from(await w.xlsx.writeBuffer());
}
describe('Lectura Excel aislada', () => {
  const original = { ...process.env };
  afterEach(() => (process.env = { ...original }));
  it('lee XLSX con celdas combinadas, conserva ceros y excluye los totales', async () => {
    const r = await new PedidoExcelService().extraer(await excel());
    expect(r.renglones).toHaveLength(2);
    expect(r.renglones[0].codigoDeclarado).toBe('000123-001');
  });
  it('lee LOTE_PRODUCTO como texto, incluido el formato numérico con ceros iniciales', async () => {
    const w = new Workbook(),
      h = w.addWorksheet('DetalleFactura');
    h.addRow(['FACTURA ZD NO. 753889']);
    h.addRow(['NOMBRE_PRODUCTO', 'CUM', 'INVIMA', 'LOTE_PRODUCTO', 'Fecha Vence']);
    h.addRow(['Producto', '000123-001', '2021M-1', 123, '02N1C2']);
    h.getCell('D3').numFmt = '000000';
    const r = await new PedidoExcelService().extraer(Buffer.from(await w.xlsx.writeBuffer()));
    expect(r.renglones[0].lotesDeclarados).toEqual(['000123']);
  });
  it('rechaza archivos ajenos, dañados y superiores al límite', async () => {
    const s = new PedidoExcelService();
    await expect(s.extraer(Buffer.from('PDF'))).rejects.toMatchObject({ status: 400 });
    await expect(s.extraer(Buffer.from('PK\x03\x04dañado'))).rejects.toMatchObject({ status: 400 });
    process.env.INVIMA_EXCEL_MAX_BYTES = '4';
    await expect(s.extraer(await excel())).rejects.toMatchObject({ status: 413 });
  });
  it('lee cantidades numéricas del original sin confundirlas con precios, lotes ni factores', async () => {
    const w = new Workbook(),
      h = w.addWorksheet('DetalleFactura');
    h.addRow(['FACTURA ZD NO. 753889']);
    h.addRow([
      'PRODUCTO',
      'NOMBRE_PRODUCTO',
      'CANTIDAD_PRESENTACION',
      'VALOR_PRESENTACION',
      'CANTIDAD_UNIDADES',
      'FACTOR_CONVERSION',
      'CUM',
      'INVIMA',
    ]);
    h.addRow(['0001', 'Producto', 3, 13454, 42, 14, '000123-001', '2021M-006528-R4']);
    h.addRow(['0002', 'Producto cero', 0, 0, 0, 10, '', '']);
    const r = await new PedidoExcelService().extraer(Buffer.from(await w.xlsx.writeBuffer()));
    expect(r.renglones[0]).toMatchObject({
      cantidad: 42,
      cantidadPresentacion: 3,
      codigoDeclarado: '000123-001',
    });
    expect(r.renglones[1]).toMatchObject({ cantidad: 0, cantidadPresentacion: 0 });
  });
  it('limita renglones y termina el trabajador cuando se agota el plazo', async () => {
    const b = await excel();
    process.env.INVIMA_EXCEL_MAX_ROWS = '1';
    await expect(new PedidoExcelService().extraer(b)).rejects.toMatchObject({ status: 413 });
    delete process.env.INVIMA_EXCEL_MAX_ROWS;
    process.env.INVIMA_EXCEL_TIMEOUT_MS = '1';
    await expect(new PedidoExcelService().extraer(b)).rejects.toMatchObject({ status: 408 });
    delete process.env.INVIMA_EXCEL_TIMEOUT_MS;
    expect((await new PedidoExcelService().extraer(b)).renglones).toHaveLength(2);
  });
  it('permite dos lecturas a la vez y rechaza una tercera sin perder cupos', async () => {
    const b = await excel(),
      s = new PedidoExcelService();
    const a = s.extraer(b),
      c = s.extraer(b);
    await expect(s.extraer(b)).rejects.toMatchObject({ status: 429 });
    await Promise.all([a, c]);
    expect((await s.extraer(b)).cliente).toBe('Disfarma');
  });
});
