// Local acceptance check. PDF originals and extracted text are never written to the repository.
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { strict as assert } from 'node:assert';
import { PdfExtractorService } from '../src/invima/infrastructure/pdf-extractor.service';
const expected: Record<string, [string, number]> = {
  'ad09007107200162600004d2d (1).pdf': ['XEL-19757', 2],
  'ad09000985500072600041420 (1).pdf': ['FDO 41420', 14],
  'ad08914092910072610146940.pdf': ['DIST 10146940', 3],
  'ad09005698740002600015542.pdf': ['SPCL 62829', 7],
  'fv090004787406926BOCE1014721.pdf': ['BOCE 1014721', 1],
  'ad09005698740002601415102.pdf': ['SPCL 61395', 5],
  'VEN219434.pdf': ['VEN-219434', 9],
  'ws_fv0860026442033260000482e.pdf': ['58442019', 2],
  'ad09003324260162600019401[1] (1).pdf': ['103425', 17],
  'fv0830057982004262fbaaa4a[1] (1).pdf': ['FE 97840', 10],
  'ad090175548002726935520261016165311320[1] (1).pdf': ['22495', 6],
  '8001496951_01_CVF3375764_135271463[1] (1).pdf': ['CVF3 375764', 3],
  'ws_fv0860026442033260000562b[1] (1).pdf': ['58445501', 2],
  'fv08110093930152600053153[1] (1).pdf': ['FE53153', 6],
  'fv0830057982004262fbaaa4a[1].pdf': ['FE 97840', 10],
  'fv083004148800426eab6d197[1].pdf': ['INST 259080', 26],
  'DOC-1-4128941436[1].pdf': ['MDTC 4128941436', 7],
  'ad089030029202726178220260727200928117[1] (1).pdf': ['95361604', 11],
  'ad086051926702726541220261002163101039[1].pdf': ['123786', 7],
  'ad086001357002725375120250701150536895[1].pdf': ['SD2710017753', 21],
  'fv080007763500426373772af[1].pdf': ['LM 461632', 4],
  'fv080200033500426734d9787[1].pdf': ['101134365', 8],
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
// Valores contrastados con las columnas facturadas de los originales.
const cantidadesPdf: Record<string, { formato: string; fecha: string; cantidades: number[] }> = {
  'XEL-19757': { formato: 'XINETIX', fecha: '2026-09-07', cantidades: [5, 14] },
  'FDO 41420': {
    formato: 'OFFIMEDICAS',
    fecha: '2026-07-31',
    cantidades: [30, 250, 170, 50, 40, 14, 200, 88, 300, 300, 30, 1410, 8, 30],
  },
  'DIST 10146940': { formato: 'EVEDISA', fecha: '2026-08-28', cantidades: [6, 12, 15] },
  'SPCL 62829': {
    formato: 'SEVEN_PHARMA',
    fecha: '2026-08-31',
    cantidades: [49, 1, 23, 139, 3, 2, 8970],
  },
  'SPCL 61395': {
    formato: 'SEVEN_PHARMA',
    fecha: '2026-07-29',
    cantidades: [94, 9, 680, 261, 11900],
  },
  'BOCE 1014721': { formato: 'GRUPO_AFIN', fecha: '2026-08-25', cantidades: [1] },
  'VEN-219434': {
    formato: 'VITALIS',
    fecha: '2026-08-27',
    cantidades: [60, 60, 52, 150, 60, 50, 49, 132, 24],
  },
  '58442019': { formato: 'B_BRAUN', fecha: '2026-09-01', cantidades: [1, 3] },
  'E 98063': { formato: 'LIFE', fecha: '2026-08-05', cantidades: [7100, 60, 62500, 30000, 600] },
  'E 98993': {
    formato: 'LIFE',
    fecha: '2026-08-31',
    cantidades: [
      4950, 12600, 10950, 20, 20, 10, 13, 2200, 25000, 25000, 2000, 2500, 1400, 2, 464000, 500, 14,
      1, 50, 750, 1, 400, 44000, 32000, 7000,
    ],
  },
  '103425': {
    formato: 'SICMAFARMA',
    fecha: '2026-09-28',
    cantidades: [
      5, 900, 600, 1100, 200, 1400, 1300, 400, 300, 1100, 175, 10, 2300, 1750, 1350, 40, 4,
    ],
  },
  '22495': { formato: 'VANTIVE', fecha: '2026-10-16', cantidades: [20, 96, 120, 150, 8, 12] },
  'CVF3 375764': { formato: 'CRUZ_VERDE', fecha: '2026-03-06', cantidades: [5, 8, 4] },
  '58445501': { formato: 'B_BRAUN', fecha: '2026-10-15', cantidades: [10, 8] },
  FE53153: {
    formato: 'DELTA',
    fecha: '2026-09-28',
    cantidades: [2760, 13380, 290, 3600, 1850, 300],
  },
  'FE 97840': {
    formato: 'FARMALOGICA',
    fecha: '2026-08-28',
    cantidades: [11100, 580, 5000, 680, 10060, 4870, 1940, 950, 110, 2784],
  },
  'INST 259080': {
    formato: 'ALFA_TRADING',
    fecha: '2026-10-14',
    cantidades: [
      10, 110, 1770, 6030, 1450, 5670, 45600, 3300, 3300, 500, 42, 300, 150, 1250, 4750, 7200, 2400,
      800, 800, 2400, 7000, 50, 50, 936, 50, 50,
    ],
  },
  'MDTC 4128941436': {
    formato: 'MEDTRONIC',
    fecha: '2026-08-27',
    cantidades: [1, 1, 1, 1, 1, 1, 1],
  },
  '95361604': {
    formato: 'BAXTER',
    fecha: '2026-07-27',
    cantidades: [880, 800, 240, 60, 30, 10, 2700, 14400, 330, 60, 30],
  },
  '123786': { formato: 'SURGICON', fecha: '2026-10-02', cantidades: [10, 3, 3, 10, 3, 3, 30] },
  SD2710017753: {
    formato: 'CAFAM',
    fecha: '2025-07-01',
    cantidades: [800, 545, 4, 2, 67, 2, 4, 21, 2, 12, 2, 3, 1, 1, 30, 480, 24, 500, 38, 6, 6],
  },
  'LM 461632': { formato: 'LM_INSTRUMENTS', fecha: '2026-10-20', cantidades: [50, 20, 2, 2] },
  '101134365': {
    formato: 'VYGON',
    fecha: '2026-09-28',
    cantidades: [350, 20, 20, 15, 120, 500, 20, 20],
  },
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
      assert.equal(result.renglones[9].cantidad, 300);
      assert(result.renglones.every(r => r.unidadMedida === '94'));
      assert.deepEqual(
        result.renglones.map(r => r.codigoDeclarado),
        [
          '20152417-2',
          '20004887-4',
          '20055107-1',
          '20023910-3',
          '37246-1',
          '20022576-7',
          '1983837-5',
          '51860-2',
          '19978181-24',
          '19960905-12',
          '20094117-1',
          '20048286-7',
          '20087310-2',
          '19908543-4',
        ]
      );
      assert(result.renglones[11].descripcion.startsWith('Pantoprazol 40 mg'));
    }
    if (result.numero === 'XEL-19757') {
      assert.deepEqual(
        result.renglones.map(r => r.codigoDeclarado),
        ['020155908-05', '020137454-01']
      );
      assert.deepEqual(
        result.renglones.map(r => r.registroSanitario),
        ['2022M-0020713', '2019M-0018937']
      );
      assert(result.renglones[0].descripcion.startsWith('KAPIXA 500 MG'));
      assert(result.renglones[1].descripcion.startsWith('PORIX (BORTEZOMIB)'));
    }
    if (result.numero === 'DIST 10146940') {
      assert.deepEqual(
        result.renglones.map(r => r.codigoDeclarado),
        ['20157002-01', '20157002-01', '00033103-02']
      );
      assert.deepEqual(
        result.renglones.map(r => r.registroSanitario),
        ['2019M-19450', '2019M-19450', '2020M-010394-R3']
      );
      assert.equal(result.renglones[0].descripcion, result.renglones[1].descripcion);
      assert(result.renglones.every(r => r.unidadMedida === '94'));
      assert(result.renglones[2].descripcion.startsWith('ACTILYSE ALTEPLASE'));
    }
    const codes = result.renglones.map(r => r.codigoDeclarado);
    const cantidades = cantidadesPdf[result.numero];
    if (cantidades) {
      assert.equal(result.formato, cantidades.formato);
      assert.equal(result.fecha, cantidades.fecha);
      assert.deepEqual(
        result.renglones.map(r => r.cantidad),
        cantidades.cantidades
      );
      assert(result.renglones.every(r => r.fragmento.trim() && r.paginas.length));
      if (
        ['ALFA_TRADING', 'MEDTRONIC', 'SURGICON', 'CAFAM', 'LM_INSTRUMENTS', 'VYGON'].includes(
          result.formato
        ) ||
        result.numero === '95361604'
      )
        assert(
          codes.every(c => c === ''),
          'No convertir referencias, lotes ni códigos internos en CUM.'
        );
      if (result.formato === 'FARMALOGICA') {
        assert.equal(codes[0], '019931216-05');
        assert.equal(codes[9], '019938260-02');
        assert(result.renglones[0].descripcion.startsWith('AMPICILINA'));
      }
      if (result.formato === 'ALFA_TRADING') {
        assert.equal(result.renglones[0].unidadMedida, 'caj x100');
        assert.equal(result.renglones[2].registroSanitario, '');
        assert(result.renglones[2].advertencias.some(a => a.includes('Varios registros')));
        assert.equal(result.renglones[25].paginas[0], 2);
      }
      if (result.formato === 'CAFAM' || result.formato === 'MEDTRONIC')
        assert(result.renglones.every(r => r.registroSanitario === ''));
      if (result.formato === 'VYGON')
        assert.equal(result.renglones[3].registroSanitario, '2024DM-0012392 – R1');
      if (result.numero === '103425') {
        assert.equal(
          result.renglones.reduce((n, r) => n + (r.cantidad || 0), 0),
          12934
        );
        assert.equal(result.renglones[0].codigoDeclarado, '20148959-2');
        assert.equal(result.renglones[0].descripcion, 'ADENOTROY® 6mg/2mL (Adenosina), Ampolla');
        assert.equal(result.renglones[10].codigoDeclarado, 'N.A.');
        assert.equal(result.renglones[15].codigoDeclarado, 'N/A');
        assert.equal(result.renglones[5].registroSanitario, '');
        assert(result.renglones[5].advertencias.some(a => a.includes('Varios registros')));
      }
      if (result.numero === '22495') assert(codes.every(c => c === ''));
      if (result.numero === 'CVF3 375764') {
        assert.deepEqual(codes, ['19956218-04', '20085509-02', '19995723-01']);
        assert.deepEqual(
          result.renglones.map(r => r.unidadMedida),
          ['JRP', 'CAJ', 'CAJ']
        );
      }
      if (result.formato === 'SEVEN_PHARMA') {
        assert.deepEqual(
          codes,
          result.numero === 'SPCL 62829'
            ? [
                '20142721-1',
                '20065664-01',
                '20138299-1',
                '20230057-2',
                '20103720-02',
                '20089821-01',
                '20200408-1',
              ]
            : ['20142721-1', '20138299-1', '20163216-4', '20230057-2', '20200408-1']
        );
        assert(result.renglones[0].descripcion.startsWith('IRBIGEN® 150 MG'));
        assert(result.renglones.at(-1)!.descripcion.startsWith('OMEPRAZOL 40 MG'));
        assert(
          result.renglones.every(
            r => !/Cantidad Lote|Codigo de barras|CUFE|Hora de creación/.test(r.descripcion)
          )
        );
        assert.equal(result.renglones[0].registroSanitario, '2019M-0019283');
        assert.equal(result.renglones.at(-1)!.registroSanitario, '2023M-0021105');
        assert.deepEqual(
          result.renglones.at(-1)!.paginas,
          result.numero === 'SPCL 62829' ? [2] : [1]
        );
      }
      if (result.formato === 'GRUPO_AFIN') {
        assert.equal(codes[0], '20105447-1');
        assert.equal(result.renglones[0].registroSanitario, '2017MB-0017820');
        assert.equal(
          result.renglones[0].descripcion,
          'ONCASPAR 3750UI/5ML SOLUCION INYECTABLE VIAL X 1 @ (2°C-8° C)'
        );
      }
      if (result.formato === 'VITALIS') {
        assert.deepEqual(codes, [
          '020019105-10',
          '019934768-18',
          '019922562-10',
          '020006845-09',
          '020011388-13',
          '019926478-05',
          '020162259-04',
          '019924285-34',
          '020045072-04',
        ]);
        assert.equal(result.renglones[0].descripcion, 'DEXAMETASONA 8 MG/2 ML - C100 LVC NF');
        assert.equal(result.renglones[8].registroSanitario, '2021M-0013188-R1');
      }
      if (result.numero === '58442019') {
        assert(codes.every(c => c === ''));
        assert(
          result.renglones.every(
            r => r.unidadMedida === 'UN' && r.registroSanitario === '2018DM-0017953'
          )
        );
        assert.equal(result.renglones[0].descripcion, result.renglones[1].descripcion);
        assert(result.renglones.every(r => r.paginas[0] === 1));
      }
      if (result.numero === 'E 98063') {
        assert.deepEqual(codes, ['20220067', '20016113', '', '', '']);
        assert.deepEqual(
          result.renglones.map(r => r.registroSanitario),
          ['2022DM-0024892', '2019DM-0005268-R1', '', '2014DM-0011605', '2019DM-0020280']
        );
        assert.equal(result.renglones[0].descripcion, 'GUANTE ESTERIL TALLA 7 (M & H CARE)');
        assert(result.renglones[2].advertencias.some(a => a.includes('registro sanitario')));
      }
      if (result.numero === 'E 98993') {
        assert.equal(result.paginas, 3);
        assert.deepEqual(
          result.renglones.map(r => r.paginas[0]),
          [...Array(15).fill(1), ...Array(10).fill(2)]
        );
        assert.equal(result.renglones[19].codigoDeclarado, '20252482');
        assert(result.renglones[19].descripcion.startsWith('EQUIPO MICROGOTEO'));
        assert(result.renglones[23].descripcion.startsWith('ELECTRODO ADULTO'));
      }
    }
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
