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

  it('Delta distingue IUM de CUM y conserva registros MB con saltos de línea', () => {
    const f = extraerFactura([
      {
        num: 1,
        text:
          'VLR TOTAL\tDESCRIPCION\tCUM/IUM\n' +
          '2.760\t1T10034410081\n00\n6.312.120,00\tLOTE01 28-02-2029\t$2.287\t1\tINVIMA 2022M-0020635\tCaja x 10 amp.\tPRODUCTO A\n500 MG\nUD\n' +
          '290\t020084686-06\t1.753.630,00\tLOTE02 27-05-2028\t$6.047\t2\tINVIMA 2021MB-\n0016475-R1\nCaja x 10 jer. prell.\nde 0,2 mL\nPRODUCTO B\n20 MG\nUD\n' +
          'Tel: 123\nLaboratorios Delta S.A.S\nNo. FE53153\n28/11/2026\nFECHA FACTURA:\n28/09/2026 11:35:27 a. m.\nTotal Items: 2',
      },
    ]);
    expect(f).toMatchObject({
      formato: 'DELTA',
      numero: 'FE53153',
      fecha: '2026-09-28',
      extractorVersion: '7',
      nitProveedor: '811009393',
    });
    expect(f.renglones).toHaveLength(2);
    expect(f.renglones[0]).toMatchObject({
      tipo: 'MEDICAMENTO',
      descripcion: 'PRODUCTO A 500 MG',
      codigoDeclarado: '',
      registroSanitario: '2022M-0020635',
    });
    expect(f.renglones[0].advertencias.join(' ')).toContain('IUM 1T1003441008100');
    expect(f.renglones[1]).toMatchObject({
      tipo: 'MEDICAMENTO',
      descripcion: 'PRODUCTO B 20 MG',
      codigoDeclarado: '020084686-06',
      registroSanitario: '2021MB-0016475-R1',
    });
  });

  it('Delta separa la presentación multilínea de la descripción', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'Laboratorios Delta S.A.S\n13.380\t020207128-02\t23.816.400,00\tLOTE 30-07-2028\t$1.780\t1\tINVIMA 2025M-0021838\tCaja x 10 vial de 10\nmL\nPRODUCTO\nINYECTABLE\nUD\nTel: 123',
      },
    ]);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'PRODUCTO INYECTABLE',
      codigoDeclarado: '020207128-02',
    });
  });

  it('Vantive conserva renglones sin CUM y excluye los códigos internos y las fechas', () => {
    const f = extraerFactura([
      {
        num: 1,
        text:
          'VANTIVE S.A.S.\nFACTURA ELECTRÓNICA DE VENTA\nNo. 22511\n2026/10/20 11:09:00\nCODIGO PRODUCTO C.U.M. DESCRIPCION\nUNITARIO VALOR TOTAL\n' +
          '1.- PRODUCTO A\nSOLUCION 2 L EA 64,00\t23282-12\t28-05-31\tLOTE01\tARB9816 // 13.824,00 884.736\n' +
          '2.- PRODUCTO B EA 120,00\t28-07-31\t12345678\tARM4466E // 3.286,00 394.320\nTotal Nro Líneas: 2\nIMPORTANTE: condiciones',
      },
    ]);
    expect(f).toMatchObject({ formato: 'VANTIVE', numero: '22511', fecha: '2026-10-20' });
    expect(f.renglones).toHaveLength(2);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'PRODUCTO A SOLUCION 2 L',
      codigoDeclarado: '23282-12',
      tipo: 'MEDICAMENTO',
    });
    expect(f.renglones[1]).toMatchObject({
      descripcion: 'PRODUCTO B',
      codigoDeclarado: '',
      tipo: 'SIN_CLASIFICAR',
      registroSanitario: '',
    });
    expect(f.renglones[1].fragmento).toContain('ARM4466E');
  });

  it('Baxter recorre las páginas sin mezclar sus pies de página ni borrar renglones facturados separados', () => {
    const header =
      'LABORATORIOS BAXTER SA COLOMBIA\nFACTURA ELECTRÓNICA DE VENTA\nNo. 95344052\n2025/11/25 17:52:54\nUNITARIO VALOR TOTAL\n';
    const f = extraerFactura([
      {
        num: 1,
        text:
          header +
          '1.- PRODUCTO A EA 100,00\t0.00\t29523-03\t27-10-31\tLOTE01\tARB1302 // 1.578,00 COP 157.800 COP\nIMPORTANTE: condiciones\nResolución 2024-11-15',
      },
      {
        num: 2,
        text:
          header +
          '2.- PRODUCTO A EA 200,00\t0.00\t29523-03\t27-11-30\tLOTE02\tARB1302 // 1.578,00 COP 315.600 COP\nIMPORTANTE: condiciones',
      },
      { num: 3, text: header + 'Total Nro Líneas: 2\nIMPORTANTE: condiciones' },
    ]);
    expect(f).toMatchObject({
      formato: 'BAXTER',
      numero: '95344052',
      fecha: '2025-11-25',
      paginas: 3,
    });
    expect(f.renglones).toHaveLength(2);
    expect(f.renglones.map(r => r.codigoDeclarado)).toEqual(['29523-03', '29523-03']);
    expect(f.renglones.map(r => r.paginas)).toEqual([[1], [2]]);
    expect(f.renglones.every(r => !r.fragmento.includes('IMPORTANTE'))).toBe(true);
  });

  it('Cruz Verde conserva ceros, une CUM partido y no duplica las líneas de lotes', () => {
    const header =
      'DROGUERÍAS Y FARMACIAS CRUZ VERDE SAS.\nFACTURA ELECTRÓNICA DE VENTA\nCVF3 397884\n26-08-2026\nFECHA DE EXPEDICIÓN\nRANGO INICIAL CVF3 300001\nMEDIO DE PAGO\n';
    const f = extraerFactura([
      {
        num: 1,
        text:
          header +
          '1 28.090,00 28.090,00\t134171 CAJ 0,00 0,00 0,00\tPRODUCTO A\nCUM:00032897-22\nCANTIDAD 1 / LOTE01 / 30-03-2029\nCANTIDAD 2 / LOTE02 / 30-04-2029\n1.\n6 96.364,00 578.184,00\t569684 FCO 0,00 0,00 0,00\tPRODUCTO B CUM:20288002-\n01\nCANTIDAD 6 / LOTE03 / 30-08-2028\n2.\nLineas facturadas: 2\nPag. 1 de 2',
      },
      { num: 2, text: header + 'TOTAL FACTURA 1234\nCUFE 123456789' },
    ]);
    expect(f).toMatchObject({ formato: 'CRUZ_VERDE', numero: 'CVF3 397884', fecha: '2026-08-26' });
    expect(f.renglones).toHaveLength(2);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'PRODUCTO A',
      codigoDeclarado: '00032897-22',
      cantidad: 1,
      unidadMedida: 'CAJ',
    });
    expect(f.renglones[1]).toMatchObject({
      descripcion: 'PRODUCTO B',
      codigoDeclarado: '20288002-01',
      cantidad: 6,
    });
  });

  it('Cruz Verde retiene productos sin identificador sin tomar el código interno como CUM', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'DROGUERIAS Y FARMACIAS CRUZ VERDE SAS.\nMEDIO DE PAGO\n1 10,00 10,00\t123456 CAJ 0,00 0,00 0,00\tPRODUCTO SIN CODIGO\nCANTIDAD 1 / 876543 / 30-03-2029\n1.\nLineas facturadas: 1',
      },
    ]);
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'PRODUCTO SIN CODIGO',
      codigoDeclarado: '',
      tipo: 'SIN_CLASIFICAR',
    });
  });

  it('B. Braun separa registro de dispositivo, expediente, referencia y lotes', () => {
    const header =
      'B. Braun Medical S.A\nFACTURA ELECTRÓNICA DE VENTA\nNo. 58445501\nFecha Vencimiento\n12.02.2027\nFecha Factura\n15.10.2026\nItem\tCantidad\tValor unitario\tDenominación del producto\n';
    const f = extraerFactura([
      {
        num: 1,
        text:
          header +
          'Su documento 43132 de 10.09.2026\n1\t10\t675.600\t6.756.000\tPRODUCTO ESTERIL\nMARCA DE PRUEBA\nGP312R\tUN\t19%\nReg. Sanitario No:\tExpediente:\tINVIMA 2018DM-0017953\t20144345\nPartida Arancelaria: 90.18.90.90.90\nLote: No.:\tVence:\t53069045\t10052031\t10\tCant:\nLote: No.:\tVence:\tOTROLOTE\t10052031\t5\tCant:\nCarrera 19 No. 100-45\nCUFE: firma',
      },
      { num: 2, text: header + 'Sub-Total\t12.809.600\nNúmero de líneas: 1' },
    ]);
    expect(f).toMatchObject({ formato: 'B_BRAUN', numero: '58445501', fecha: '2026-10-15' });
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'PRODUCTO ESTERIL MARCA DE PRUEBA',
      tipo: 'DISPOSITIVO',
      codigoDeclarado: '',
      registroSanitario: '2018DM-0017953',
      cantidad: 10,
      unidadMedida: 'UN',
    });
    expect(f.renglones[0].fragmento).toContain('20144345');
    expect(f.renglones[0].fragmento).not.toContain('Carrera');
  });
});
