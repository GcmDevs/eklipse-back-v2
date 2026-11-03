// Read-only acceptance check. Never saves a document in the application database.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { strict as assert } from 'node:assert';
import { PedidoExcelService } from '../src/invima/infrastructure/pedido-excel.service';
import { Workbook } from 'exceljs';
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Indique la ruta del pedido .xlsx.');
  const parsed = await new PedidoExcelService().extraer(await readFile(file));
  const book = new Workbook();
  await book.xlsx.readFile(file);
  for (const row of parsed.renglones) {
    const sheet = book.getWorksheet(row.hoja!)!;
    // Buscar cabecera, no asumir posiciones fijas ni usar valores de totales.
    let cantidadColumn = 0,
      presentacionColumn = 0;
    sheet.eachRow((r, n) => {
      if (n >= row.fila!) return;
      r.eachCell((c, col) => {
        if (['CANTIDAD', 'CANTIDAD_UNIDADES'].includes(c.text.trim().toUpperCase()))
          cantidadColumn = col;
        if (c.text.trim().toUpperCase() === 'CANTIDAD_PRESENTACION') presentacionColumn = col;
      });
    });
    for (const [column, actual] of [
      [cantidadColumn, row.cantidad],
      [presentacionColumn, row.cantidadPresentacion],
    ])
      if (column && typeof sheet.getRow(row.fila!).getCell(column).value === 'number')
        assert.equal(actual, sheet.getRow(row.fila!).getCell(column).value);
  }
  if (parsed.numero === '1081272') {
    assert.equal(parsed.renglones.length, 46);
    assert.equal(parsed.fecha, '2026-10-19');
    assert.equal(parsed.proveedor, '');
    assert.equal(new Set(parsed.renglones.map(r => r.codigoDeclarado)).size, 44);
    assert.deepEqual(
      parsed.renglones.map(r => r.fila),
      Array.from({ length: 46 }, (_, i) => i + 6)
    );
    assert.equal(parsed.renglones[0].codigoDeclarado, '53560-5');
    assert.match(parsed.renglones[0].descripcion, /ACETAMINOFEN/);
    assert.equal(parsed.renglones[45].codigoDeclarado, '20088760-2');
    assert.match(parsed.renglones[45].descripcion, /ESCITALOPRAM/);
    assert.equal(
      parsed.renglones.filter(r => r.advertencias.some(a => a.startsWith('CUM repetido'))).length,
      3
    );
  }
  if (parsed.numero === 'ZD 753889') {
    assert.equal(parsed.tipoDocumento, 'FACTURA');
    assert.equal(parsed.renglones.length, 100);
    assert.equal(parsed.fecha, '2026-09-30');
    assert.equal(
      parsed.renglones.reduce((n, r) => n + (r.cantidad || 0), 0),
      32114
    );
    assert.equal(
      parsed.renglones.reduce((n, r) => n + (r.cantidadPresentacion || 0), 0),
      1501
    );
    assert.deepEqual(
      parsed.renglones.map(r => r.fila),
      Array.from({ length: 100 }, (_, i) => i + 7)
    );
    assert.equal(parsed.renglones[1].codigoDeclarado, '20192258-1');
    assert.equal(parsed.renglones[1].cantidad, 42);
    assert.equal(parsed.renglones[1].cantidadPresentacion, 3);
  }
  const dir = resolve('../ignored/invima-qa');
  await mkdir(dir, { recursive: true });
  await writeFile(
    resolve(
      dir,
      parsed.tipoDocumento === 'FACTURA' ? 'disfarma-factura-extraida.json' : 'pedido-extraido.json'
    ),
    JSON.stringify(parsed, null, 2)
  );
  console.log(
    `${parsed.tipoDocumento} ${parsed.numero}: ${parsed.renglones.length} renglones, cantidades y evidencia verificadas.`
  );
}
main().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
