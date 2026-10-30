import { extraerFactura } from './factura.extractor';

describe('Seven Pharma, Grupo Afín, Vitalis y cantidades Life', () => {
  const sevenHeader =
    'SEVEN PHARMA COLOMBIA S.A.S\nSPCL - 62.829\nFecha de Factura\nFecha de\nVencimiento\n2026-08-31\n2026-12-29\nHora de creación: 81459 Tiempo expresado en HHMMSS\n900106694-2\n';
  it('Seven Pharma conserva productos por página, CUM y cantidades sin mezclar precios ni repetir lotes', () => {
    const f = extraerFactura([
      {
        num: 1,
        text:
          sevenHeader +
          'MEDICAMENTO 150 MG CAJA X\n30 TABLETAS\n4.500,00 220.500,00\t49.00\tINVIMA 2019M-0019283 020142721-01\nLote:\nLOTE1\nCantidad Lote:\n20,00\nLote:\nLOTE2\nCantidad Lote:\n29,00\nPrincipio Activo:\nNO ES OTRO PRODUCTO\nCodigo de barras:\n8903726237687\nPágina 1 de 3\nCUFE: 123',
      },
      {
        num: 2,
        text:
          sevenHeader +
          'OTRO MEDICAMENTO 40 MG\n1.500,00 13.455.000,00\t8970.00\tINVIMA 2023M-0021105 20200408-1\nLote:\nNP25181A\nCantidad Lote:\n8.970,00\nCodigo de barras:\n8902413022124\nTotal Bruto:\n13.455.000,00',
      },
      {
        num: 3,
        text: sevenHeader + 'Total Bruto:\n13.455.000,00\nOBSERVACIONES:\nBasado en Pedidos 123',
      },
    ]);
    expect(f).toMatchObject({
      formato: 'SEVEN_PHARMA',
      numero: 'SPCL 62829',
      fecha: '2026-08-31',
      nitProveedor: '900569874',
    });
    expect(f.renglones.map(r => r.cantidad)).toEqual([49, 8970]);
    expect(f.renglones.map(r => r.paginas)).toEqual([[1], [2]]);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'MEDICAMENTO 150 MG CAJA X 30 TABLETAS',
      codigoDeclarado: '020142721-01',
      registroSanitario: '2019M-0019283',
    });
  });
  it.each([
    ['0.00', 0],
    ['1,100.50', 1100.5],
    ['-5.00', null],
    ['N.A.', null],
    ['', null],
  ] as const)(
    'Seven Pharma conserva %s como %s y retiene identificadores ausentes',
    (raw, expected) => {
      const f = extraerFactura([
        {
          num: 1,
          text:
            sevenHeader +
            `PRODUCTO SIN CUM\n1.500,00 0,00\t${raw}\t\nLote:\n123\nCodigo de barras:\n8902413022124\nTotal Bruto:`,
        },
      ]);
      expect(f.renglones).toHaveLength(1);
      expect(f.renglones[0]).toMatchObject({
        cantidad: expected,
        codigoDeclarado: '',
        registroSanitario: '',
        descripcion: 'PRODUCTO SIN CUM',
      });
      if (expected === null)
        expect(f.renglones[0].advertencias.join(' ')).toContain('cantidad válida');
    }
  );
  it('Grupo Afín recupera expedición, MB multilínea, cantidad y CUM sin usar ATC o código interno', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'GRUPO AFIN FARMACEUTICA SAS BIC\nFecha de expedición:\n24/10/2026\nFecha de vencimiento:\n25/08/2026 18:08\nFecha de certificación: 2026-08-25 18:08:16\nBOCE 1014721\nPRECIO\nUNITARIO\n1\tINVIMA 2017MB-\n0017820\nC140017 $ 5,751,262\t0%\t04/11/2026\t6244A $ 5,751,262\t020105447-01\tONCASPAR 3750UI/5ML VIAL X\n1 @ (2°C-8° C)\nL01XX24\nSubtotal\n$ 5,751,262',
      },
    ]);
    expect(f).toMatchObject({ formato: 'GRUPO_AFIN', numero: 'BOCE 1014721', fecha: '2026-08-25' });
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 1,
      codigoDeclarado: '020105447-01',
      registroSanitario: '2017MB-0017820',
      descripcion: 'ONCASPAR 3750UI/5ML VIAL X 1 @ (2°C-8° C)',
    });
  });
  it('Grupo Afín conserva la descripción cuando la columna CUM está vacía', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'GRUPO AFIN FARMACEUTICA\nPRECIO\nUNITARIO\n2\tINVIMA 2017MB-0017820\nC140017 $ 100\t0%\t04/11/2026\t6244A $ 200\t\tPRODUCTO SIN CUM\nL01XX24\nSubtotal',
      },
    ]);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 2,
      codigoDeclarado: '',
      descripcion: 'PRODUCTO SIN CUM',
    });
  });
  it('Vitalis conserva ceros del CUM y cantidad principal sin multiplicar C100 ni usar lote o número de cajas', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'VITALIS S.A.C.I.\nFACTURA ELECTRONICA DE VENTA\nNo. VEN-219434\nFECHA DE EMISIÓN: 2026-08-27 HORA: 17:46:42\nFECHA DE VENCIMIENTO: 2026-11-25\nA260442\nVence:\n21.06.2028\nDEXAMETASONA 8 MG/2 ML - C100 LVC NF\nREGISTRO SANITARIO: INVIMA 2022M-0012145-R2\nCUM: 020019105-10 SOLUCIÓN INYECTABLE 60 70.000,00 4.200.000,00\nA260443\nVence:\n21.06.2028\nOTRO PRODUCTO\nREGISTRO SANITARIO: INVIMA 2022M-0012145-R2\nCUM: 020019105-10 SOLUCIÓN INYECTABLE 2 70.000,00 140.000,00\nLOTE DESCRIPCIÓN CÓDIGO FORMA FARMACEUTICA CANTIDAD VLR. UNIT TOTAL\nSUBTOTAL $\n4.340.000,00\nNo. CAJAS\n5,00',
      },
    ]);
    expect(f).toMatchObject({
      formato: 'VITALIS',
      numero: 'VEN-219434',
      fecha: '2026-08-27',
      nitProveedor: '830068119',
    });
    expect(f.renglones.map(r => r.cantidad)).toEqual([60, 2]);
    expect(f.renglones[0]).toMatchObject({
      codigoDeclarado: '020019105-10',
      descripcion: 'DEXAMETASONA 8 MG/2 ML - C100 LVC NF',
      registroSanitario: '2022M-0012145-R2',
    });
  });
  it('Vitalis deja la cantidad negativa vacía con advertencia y retiene N.A.', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'VITALIS S.A.C.I.\nA260442\nVence:\n21.06.2028\nPRODUCTO\nREGISTRO SANITARIO: NO REQUIERE\nCUM: N.A. SOLUCIÓN -2 70.000,00 140.000,00\nSUBTOTAL',
      },
    ]);
    expect(f.renglones[0]).toMatchObject({
      cantidad: null,
      codigoDeclarado: 'N.A.',
      registroSanitario: '',
    });
  });
  it('Life conserva la cantidad total del renglón con descripción multilínea y varios lotes', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'LIFE SUMINISTROS MEDICOS\nActividad ICA : 203 10,00x mil 98993\n2026 8 31 2026 12 31\nDM09073 EQUIPO MICROGOTEO SIN AGUJA (M & H\nCARE)\n750.00\t1,000.00 750,000.00\t0.00 19\nLOTE: VENCE:\tCANT: CUM:\t2410774 715.00 30/04/2029 20252482\tINVIMA 2023DM-0026967\nLOTE: VENCE:\tCANT: CUM:\t2610992 35.00 19/03/2031 20252482\tINVIMA 2023DM-0026967\nDM11030 MULETAS TALLA M 0.00\t69,000.00 0.00\nLOTE: VENCE: CUM: IMP1 0.00 31/12/2031 INVIMA 2021DM-0024472\nPor favor abstenerse',
      },
    ]);
    expect(f.renglones.map(r => r.cantidad)).toEqual([750, 0]);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'EQUIPO MICROGOTEO SIN AGUJA (M & H CARE)',
      codigoDeclarado: '20252482',
    });
  });
  it('Life no usa precio, lote ni CUM como cantidad cuando falta la columna', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'LIFE SUMINISTROS MEDICOS\nDM16023 PRODUCTO 750.00\t5,325,000.00\nLOTE: VENCE:\tCANT: CUM:\t251225 7,100.00 30/12/2030 20220067\tINVIMA 2022DM-0024892\nSUBTOTAL',
      },
    ]);
    expect(f.renglones[0].cantidad).toBeNull();
    expect(f.renglones[0].advertencias.join(' ')).toContain('cantidad válida');
  });
});
