import { extraerFactura } from './factura.extractor';
describe('Extracción de facturas desde texto pdf-parse', () => {
  it('no selecciona silenciosamente un CUM cuando un renglón declara varios', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'XINETIX\n1 101 PRODUCTO 10 MG\nLote - Fech Ven - Cantidad\nRS: 2022M-123, CUM: 000123-01\nCUM: 000123-02\nTotal Items: 1',
      },
    ]);
    expect(f.renglones[0].codigoDeclarado).toBe('');
    expect(f.renglones[0].advertencias.join(' ')).toContain('Varios CUM');
    expect(f.renglones[0].fragmento).toContain('000123-02');
  });
  it('separa CUM con ceros iniciales del IUM unido y une la descripción Xinetix', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: `XINETIX PHARMA\nFactura Electrónica de Venta XEL-123\nFECHA GENERACIÓN: Septiembre 07 2026\n1 101 PRODUCTO 500 MG CAJA\nPOR 20 TABLETAS\nLote - Fech Ven - Cantidad\nRS: 2022M-0020713, CUM: 020155908-05IUM: 1C1001651009104\n5 $ 100\nTotal Items: 1`,
      },
    ]);
    expect(f.numero).toBe('XEL-123');
    expect(f.fecha).toBe('2026-09-07');
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'PRODUCTO 500 MG CAJA POR 20 TABLETAS',
      codigoDeclarado: '020155908-05',
      registroSanitario: '2022M-0020713',
    });
  });
  it('no confunde el rango DIAN ni su fecha con la factura Offimedicas y mantiene continuaciones', () => {
    const header =
      'Resolución 24/10/2022 AUTORIZA DEL FDO 20001 AL FDO 100000\nFDO 41420\n29 /09/2026\t31 /07 / 2026 12:00:00 AM\nCRÉDITO\n';
    const f = extraerFactura([
      {
        num: 1,
        text:
          header +
          '95.00 28500.00\t300.00\t111 94 0.00\tVITAMINA A 50000 UI\nCAJA X 300 Cum ( 19960905-12 ) Atc ( A11CA01 )\n0.00\nnoc000041(Productos institucionales)',
      },
      {
        num: 2,
        text:
          header +
          'Invima ( 2023M-0005759-R2 ) Lote 123\nVence 04/28\n273.00 8190.00\t30.00\t112 94 0.00\tOTRO PRODUCTO\nCum ( 20094117-1 )\nnoc000041(Condiciones)',
      },
    ]);
    expect(f.numero).toBe('FDO 41420');
    expect(f.fecha).toBe('2026-07-31');
    expect(f.renglones).toHaveLength(2);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'VITAMINA A 50000 UI CAJA X 300',
      paginas: [1, 2],
      registroSanitario: '2023M-0005759-R2',
    });
  });
  it('Life conserva un renglón con varios lotes y códigos sin convertirlos en CUM', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: `LIFE SUMINISTROS MEDICOS\nActividad ICA : 203 10,00x mil 98993\n2026 8 31 2026 12 31\nDM09073 EQUIPO MICROGOTEO SIN AGUJA (M & H\nCARE)\n750.00\t1000.00\nLOTE: VENCE:\tCANT: CUM:\t2410774 715.00 30/04/2029 20252482\tINVIMA 2023DM-0026967\nLOTE: VENCE:\tCANT: CUM:\t2610992 35.00 19/03/2031 20252482\tINVIMA 2023DM-0026967\nDM11030 MULETAS TALLA M 14.00\t69000.00\nLOTE: VENCE: CUM: IMP1 14.00 31/12/2031 INVIMA 2021DM-0024472\nPor favor abstenerse`,
      },
    ]);
    expect(f.numero).toBe('E 98993');
    expect(f.renglones).toHaveLength(2);
    expect(f.renglones[0]).toMatchObject({
      tipo: 'DISPOSITIVO',
      descripcion: 'EQUIPO MICROGOTEO SIN AGUJA (M & H CARE)',
      codigoDeclarado: '20252482',
    });
    expect(f.renglones[1].codigoDeclarado).toBe('');
  });
  it('Sicmafarma conserva N.A., autorizaciones y registros contradictorios para revisión', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: `SICMAFARMA\nFACTURA ELECTRÓNICA DE VENTA\n102485\n28-08-2026 12:40:54\n20148959-2 \tCJX5 \t30-01-2029\t2E26002\t3000004 \t0 \t574050\tPRODUCTO 6mg/2mL, Ampolla \t19135\t1\t0\n30.00\nAuto/Reg. Invima: 2019M-0019333\n2018M-0019333\nN.A. \tCJX1 \t30-03-2029\tGN8526\t502083002-I\t0\t2570400\tOTRO PRODUCTO 50mg/10mL\t12852\t2\t0\n200.00\nAuto/Reg. Invima: 2025001742 2024000847\nTotal Cantidad: 230`,
      },
    ]);
    expect(f.renglones).toHaveLength(2);
    expect(f.renglones[0].registroSanitario).toBe('');
    expect(f.renglones[0].advertencias.join(' ')).toContain('Varios registros');
    expect(f.renglones[1]).toMatchObject({
      codigoDeclarado: 'N.A.',
      registroSanitario: '',
      descripcion: 'OTRO PRODUCTO 50mg/10mL',
    });
  });
  it('Evedisa une el CUM de la línea siguiente sin precios en la descripción', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'DIST - 10146949\n29/08/2026\n134848 94 10.00 2833760.00\t\nPRODUCTO 1G CJ X 10 CUM:\n20104180-01 ATC: J01DI54 R.INV: 2023M-0018164-R1\nLAB: 1 LOTE: 2 FECHA VENC:\n20280830\nDe conformidad',
      },
    ]);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'PRODUCTO 1G CJ X 10',
      codigoDeclarado: '20104180-01',
    });
  });
  it('un formato desconocido permite captura manual sin inventar productos desde fechas', () => {
    const f = extraerFactura([
      { num: 1, text: 'Factura proveedor nuevo\nFecha 2026-08-01\nTotal 1234' },
    ]);
    expect(f.formato).toBe('DESCONOCIDO');
    expect(f.renglones).toEqual([]);
    expect(f.advertencias.join(' ')).toContain('manualmente');
  });
});
