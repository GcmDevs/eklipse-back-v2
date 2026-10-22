// Read-only acceptance check. Never saves a document in the application database.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { strict as assert } from 'node:assert';
import { PedidoExcelService } from '../src/invima/infrastructure/pedido-excel.service';
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Indique la ruta del pedido .xlsx.');
  const parsed = await new PedidoExcelService().extraer(await readFile(file));
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
  const dir = resolve('../ignored/invima-qa');
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, 'pedido-extraido.json'), JSON.stringify(parsed, null, 2));
  console.log(
    `Pedido ${parsed.numero}: ${parsed.renglones.length} renglones, cliente ${parsed.cliente}, asociaciones y evidencia verificadas.`
  );
}
main().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
