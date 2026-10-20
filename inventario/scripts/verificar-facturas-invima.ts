// Local acceptance check. PDF originals and extracted text are never written to the repository.
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { strict as assert } from 'node:assert';
import { PdfExtractorService } from '../src/invima/infrastructure/pdf-extractor.service';
const expected: Record<string, [string, number]> = {
  'ad08914092910072610146949.pdf': ['DIST 10146949', 1],
  'ad09000985500072600041587.pdf': ['FDO 41587', 1],
  'ad09000985500072600041420.pdf': ['FDO 41420', 14],
  'ad09007107200162600004d2d.pdf': ['XEL-19757', 2],
  'ad09003324260162600019055.pdf': ['102485', 18],
  'fv090024017700426232125b5.pdf': ['E 98063', 5],
  'fv09002401770042657029c0d.pdf': ['E 98993', 25],
};
async function main() {
  if (!process.argv.slice(2).length) throw new Error('Indique las rutas de las facturas PDF.');
  const extractor = new PdfExtractorService();
  for (const path of process.argv.slice(2)) {
    const result = await extractor.extraer(await readFile(path));
    const check = expected[basename(path)];
    if (check) {
      assert.equal(result.numero, check[0]);
      assert.equal(result.renglones.length, check[1]);
    }
    assert(
      result.renglones.every(r => r.descripcion.trim()),
      'Cada renglón debe tener descripción.'
    );
    if (result.formato === 'XINETIX')
      assert.equal(result.renglones[0].codigoDeclarado, '020155908-05');
    if (result.numero === 'FDO 41420') {
      assert.deepEqual(result.renglones[9].paginas, [1, 2]);
      assert.equal(result.renglones[9].registroSanitario, '2023M-0005759-R2');
    }
    console.log(
      JSON.stringify({
        archivo: basename(path),
        factura: result.numero,
        formato: result.formato,
        fecha: result.fecha,
        renglones: result.renglones.length,
        validacion: 'OK',
      })
    );
  }
}
void main().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
