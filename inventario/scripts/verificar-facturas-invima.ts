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
  'fv08110093930152600053153[1].pdf': ['FE53153', 6],
  'ad090175548002726633720261020121108759[1].pdf': ['22511', 3],
  'ad089030029202725502020251125195433054[1].pdf': ['95344052', 30],
  '8001496951_01_CVF3397884_155910030[1].pdf': ['CVF3 397884', 13],
  'ws_fv0860026442033260000562b[1].pdf': ['58445501', 2],
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
    if (result.numero === 'XEL-19757')
      assert.equal(result.renglones[0].codigoDeclarado, '020155908-05');
    if (result.numero === 'FDO 41420') {
      assert.deepEqual(result.renglones[9].paginas, [1, 2]);
      assert.equal(result.renglones[9].registroSanitario, '2023M-0005759-R2');
    }
    const codes = result.renglones.map(r => r.codigoDeclarado);
    if (result.numero === 'FE53153') {
      assert.equal(result.formato, 'DELTA');
      assert.equal(result.fecha, '2026-09-28');
      assert.deepEqual(codes, [
        '',
        '020207128-02',
        '020084686-06',
        '020084685-06',
        '020084687-06',
        '020084690-06',
      ]);
      assert.deepEqual(
        result.renglones.map(r => r.registroSanitario),
        [
          '2022M-0020635',
          '2025M-0021838',
          '2021MB-0016475-R1',
          '2021MB-0016079-R1',
          '2021MB-0016080-R1',
          '2021MB-0016141-R1',
        ]
      );
      assert(result.renglones[0].advertencias.some(w => w.includes('IUM 1T1003441008100')));
      assert(result.renglones[0].descripcion.startsWith('ACITRADELT'));
      assert(result.renglones[1].descripcion.startsWith('CEFAZIDELT'));
      for (const [i, dose] of ['20mg', '40mg', '60mg', '80mg'].entries())
        assert(result.renglones[i + 2].descripcion.startsWith(`ENOXAPARINA SODICA (${dose}`));
      assert(result.renglones.every(r => !/INVIMA|Caja x/.test(r.descripcion)));
    }
    if (result.numero === '22511') {
      assert.equal(result.formato, 'VANTIVE');
      assert.equal(result.fecha, '2026-10-20');
      assert.deepEqual(codes, ['23282-12', '24283-13', '']);
      assert(result.renglones[0].descripcion.startsWith('DIANEAL PD 2'));
      assert(result.renglones[1].descripcion.startsWith('DIANEAL PD2'));
      assert.equal(result.renglones[2].descripcion, 'MINICAP LOCAL BLISTER');
      assert.equal(result.renglones[2].tipo, 'SIN_CLASIFICAR');
    }
    if (result.numero === '95344052') {
      assert.equal(result.formato, 'BAXTER');
      assert.equal(result.fecha, '2025-11-25');
      assert.equal(result.paginas, 6);
      assert.deepEqual(codes, [
        '29522-03',
        '29523-02',
        '29523-03',
        '29523-03',
        '29523-03',
        '29523-04',
        '29523-04',
        '29522-04',
        '1982214-01',
        '1982214-02',
        '29523-05',
        '29523-05',
        '29523-06',
        '29523-06',
        '32606-02',
        '32606-02',
        '32606-02',
        '32606-03',
        '28437-02',
        '38321-02',
        '38321-02',
        '29514-02',
        '19975402-01',
        '20033290-02',
        '208141-24',
        '20118686-01',
        '20095751-03',
        '20081180-01',
        '20126194-01',
        '20175482-03',
      ]);
      for (const [index, prefix] of [
        [0, 'DEXTROSA AL 5%'],
        [2, 'CLORURO DE SODIO'],
        [14, 'INYECCION DE LACTATO'],
        [22, 'SEVOFLURANE'],
        [26, 'ONDANSETRON'],
        [29, 'OLIMEL N12E'],
      ] as const)
        assert(result.renglones[index].descripcion.startsWith(prefix));
      assert.deepEqual(
        result.renglones.map(r => r.paginas[0]),
        Array.from({ length: 30 }, (_, i) => Math.floor(i / 6) + 1)
      );
    }
    if (result.numero === 'CVF3 397884') {
      assert.equal(result.formato, 'CRUZ_VERDE');
      assert.equal(result.fecha, '2026-08-26');
      assert.deepEqual(codes, [
        '00032897-22',
        '00030969-05',
        '19942431-05',
        '19974415-03',
        '00051612-01',
        '19906379-05',
        '19973237-01',
        '20121603-03',
        '20046741-03',
        '20132662-01',
        '19961372-07',
        '20288002-01',
        '00017144-09',
      ]);
      const names = [
        'SULFATO FERROSO',
        'OSTEOCAL',
        'VASTAREL',
        'OLANZAPINA',
        'SANDIMMUN',
        'CREMA No 4',
        'AURASERT',
        'DAFULL',
        'NODOL FORTE',
        'AL DAUNO',
        'PRATEN',
        'CARBOVIT',
        'AMITRIPTILINA',
      ];
      names.forEach((name, i) => assert(result.renglones[i].descripcion.startsWith(name)));
      assert(result.renglones.every(r => r.paginas[0] === 1));
    }
    if (result.numero === '58445501') {
      assert.equal(result.formato, 'B_BRAUN');
      assert.equal(result.fecha, '2026-10-15');
      assert.deepEqual(codes, ['', '']);
      assert(
        result.renglones.every(
          r => r.tipo === 'DISPOSITIVO' && r.registroSanitario === '2018DM-0017953'
        )
      );
      assert(result.renglones[0].descripcion.includes('diametro 3.0 mm'));
      assert(result.renglones[1].descripcion.includes('diametro 5.0 mm'));
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
