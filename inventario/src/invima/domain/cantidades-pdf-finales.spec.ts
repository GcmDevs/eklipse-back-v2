import { extraerFactura } from './factura.extractor';

describe('Cantidades Xinetix, Offimedicas y Evedisa', () => {
  it('Xinetix conserva CUM con ceros y separa IUM, lotes, empaque y totales de la cantidad facturada', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'XINETIX PHARMA\n1 10222 KAPIXA 500 MG X 120 TABLETAS\nRECUBIERTAS\nLote - Fech Ven - Cantidad\nLOTE1 - 2027-12-31 - 2 , RS: 2022M-0020713,\nCUM: 020155908-05IUM: 1C1001651009104\nLOTE2 - 2027-12-31 - 3 , RS: 2022M-0020713\n5 $ 105.600 $ 0 $ 528.000,00 $ 0,00 $ 528.000\n2 10135 PORIX 3,5 MG\nLote - Fech Ven - Cantidad\nLOTE3 - 2028-08-31 - 14 , RS: INVIMA\n2019M-0018937, CUM:\n020137454-01IUM: 1B1002221010100\n14 $ 78.000 $ 0 $ 1.092.000,00\nTotal Items: 2\nTotales... 19 $ 0',
      },
      { num: 2, text: 'XINETIX PHARMA\nDias de pago: 90\nCUFE: 123' },
    ]);
    expect(f.renglones.map(r => r.cantidad)).toEqual([5, 14]);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'KAPIXA 500 MG X 120 TABLETAS RECUBIERTAS',
      codigoDeclarado: '020155908-05',
      registroSanitario: '2022M-0020713',
    });
    expect(f.renglones[1].codigoDeclarado).toBe('020137454-01');
    expect(f.renglones.every(r => r.unidadMedida === undefined)).toBe(true);
  });
  it.each([
    ['0', 0],
    ['1.500,50', 1500.5],
    ['-5', null],
    ['', null],
  ] as const)('Xinetix lee %s como %s sin sustituir con el lote', (raw, expected) => {
    const f = extraerFactura([
      {
        num: 1,
        text: `XINETIX\n1 101 PRODUCTO X 120\nLote - Fech Ven - Cantidad\nLOTE - 2027-12-31 - 9 , CUM: 000123-01\n${raw} $ 105.600 $ 0\nTotal Items: 1`,
      },
    ]);
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0].cantidad).toBe(expected);
    if (expected === null)
      expect(f.renglones[0].advertencias.join(' ')).toContain('cantidad válida');
  });
  const offHeader = 'FDO 41420\nCRÉDITO\n';
  it('Offimedicas conserva cantidad y unidad al unir continuaciones, sin multiplicar el empaque', () => {
    const f = extraerFactura([
      {
        num: 1,
        text:
          offHeader +
          '95.00 28,500.00\t300.00\t9991164 94 0.00\tVitamina A 50000 UI CAPSULA\nCaja x 300 Cum ( 19960905-12 )\n0.00\nnoc000041(Condiciones)',
      },
      {
        num: 2,
        text:
          offHeader +
          'Invima ( 2023M-0005759-R2 ) Lote 2604001226\nVence 04/28\n406.00 572,460.00\t1,410.00\t9992350 94 0.00\tPantoprazol 40 mg Caja x 30\nCum ( 20048286-7 ) Invima ( 2023M-0013481-R2 )\n0.00\nnoc000041(Condiciones)',
      },
    ]);
    expect(f.renglones.map(r => r.cantidad)).toEqual([300, 1410]);
    expect(f.renglones[0]).toMatchObject({
      paginas: [1, 2],
      unidadMedida: '94',
      registroSanitario: '2023M-0005759-R2',
    });
    expect(f.renglones[1].codigoDeclarado).toBe('20048286-7');
  });
  it.each([
    ['0.00', 0],
    ['1,410.25', 1410.25],
    ['-5.00', null],
    ['', null],
  ] as const)('Offimedicas conserva %s como %s al continuar en otra página', (raw, expected) => {
    const f = extraerFactura([
      {
        num: 1,
        text:
          offHeader +
          `95.00 28,500.00\t${raw}\t9991164 94 0.00\tPRODUCTO SIN CUM\n0.00\nnoc000041(Condiciones)`,
      },
      {
        num: 2,
        text:
          offHeader +
          'Invima ( 2023M-0005759-R2 ) Lote 2604001226\nVence 04/28\nnoc000041(Condiciones)',
      },
    ]);
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      cantidad: expected,
      codigoDeclarado: '',
      unidadMedida: '94',
      paginas: [1, 2],
    });
    if (expected === null)
      expect(f.renglones[0].advertencias.join(' ')).toContain('cantidad válida');
  });
  it('Evedisa conserva renglones de lotes separados y lee cantidad, no UM, precio o índice', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'DIST - 10146940\n28/08/2026 5:13 p. m.\n133559 94 6.00 3,881,000.00\t\nZAVICEFTA 2G/0,5G CJ X10 CUM: 20157002-01\nATC: J01DD52 R.INV: 2019M-19450 LAB: 0000103378\nLOTE: 25K06214 FECHA VENC: 20280930\n23,286,000.00\t1\n133559 94 12.00 3,881,000.00\t\nZAVICEFTA 2G/0,5G CJ X10 CUM: 20157002-01\nATC: J01DD52 R.INV: 2019M-19450\nLOTE: 26K01402 FECHA VENC: 20281230\n46,572,000.00\t2\n101783 94 15.00 3,383,612.00\t\nACTILYSE ALTEPLASE 50MG X2 CUM:\n00033103-02 ATC: B01AD02 R.INV: 2020M-010394-R3\nLAB: 0000103669 LOTE: 505363 FECHA VENC: 20280730\n50,754,180.00\t3\nDe conformidad',
      },
    ]);
    expect(f.numero).toBe('DIST 10146940');
    expect(f.renglones.map(r => r.cantidad)).toEqual([6, 12, 15]);
    expect(f.renglones.every(r => r.unidadMedida === '94')).toBe(true);
    expect(f.renglones[0].codigoDeclarado).toBe(f.renglones[1].codigoDeclarado);
    expect(f.renglones[2].codigoDeclarado).toBe('00033103-02');
    expect(f.renglones[0].fragmento).not.toContain('23,286,000.00');
  });
  it.each([
    ['0.00', 0],
    ['1,500.25', 1500.25],
    ['-5.00', null],
    ['N.A.', null],
    ['', null],
  ] as const)('Evedisa mantiene el renglón sin CUM con %s como %s', (raw, expected) => {
    const f = extraerFactura([
      {
        num: 1,
        text: `DIST - 10146940\n133559 94 ${raw} 3,881,000.00\t\nPRODUCTO SIN CUM X10\nATC: J01DD52 R.INV: 2019M-19450\nLAB: 123 LOTE: 456 FECHA VENC: 20280930\nDe conformidad`,
      },
    ]);
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      cantidad: expected,
      codigoDeclarado: '',
      descripcion: 'PRODUCTO SIN CUM X10',
      registroSanitario: '2019M-19450',
    });
    if (expected === null)
      expect(f.renglones[0].advertencias.join(' ')).toContain('cantidad válida');
  });
});
