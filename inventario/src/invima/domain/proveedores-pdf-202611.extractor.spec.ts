import { extraerFactura } from './factura.extractor';
import { PERFILES_PDF_202611 } from './proveedores-pdf-202611.extractor';

describe('Facturadores noviembre: texto sintético sin originales ni datos de clientes', () => {
  const leer = (text: string) => extraerFactura([{ num: 1, text }]);
  it('conserva renglones, lotes múltiples y registros originales sin sumar sus cantidades dos veces', () => {
    const f = extraerFactura(
      [1, 2].map(num => ({
        num,
        text: `SHERLEG LABORATORIES\n99999\n2030-01-02\nFecha y Hora de Factura\nExpedición 2030-01-02\nFACTURA ELECTRONICA DE\nVENTA\n${num}\t100001\tPRODUCTO DE PRUEBA ${num}\tUNI\t8.00\t2,000.00\t16,000.00\n000LOTE-A\t2025DM001234R1\tF.V : 2032-01-01\t7,00\n000LOTE-B\t2025DM001234R1\tF.V : 2032-01-01\t1,00`,
      }))
    );
    expect(f.numero).toBe('99999');
    expect(f.fecha).toBe('2030-01-02');
    expect(f.extractorVersion).toBe('9');
    expect(f.renglones).toHaveLength(2);
    for (const [i, r] of f.renglones.entries()) {
      expect(r).toMatchObject({
        cantidad: 8,
        codigoDeclarado: '',
        registroSanitario: '2025DM001234R1',
        tipo: 'DISPOSITIVO',
        paginas: [i + 1],
      });
      expect(r.lotesDeclarados).toEqual(['000LOTE-A', '000LOTE-B']);
      expect(r.lotesDocumento).toEqual([
        { lote: '000LOTE-A', vencimiento: '2032-01-01' },
        { lote: '000LOTE-B', vencimiento: '2032-01-01' },
      ]);
      expect(r.advertencias.join(' ')).not.toContain('Seleccione el tipo');
    }
  });
  it('reconoce LH por contenido y conserva lotes con ceros, sin usar referencia como CUM', () => {
    const f = leer(
      'PBX: 6972333\nCS 45678\n$ 200,000\t2 $ 100,000\tREF123 00000009 15% $ 30,000\tTORNILLO DE PRUEBA - INVIMA 2025DM-\n0001234 - TEXTO AJENO A LA DESCRIPCIÓN -UNIDAD\nDE 2\tPAG 1'
    );
    expect(f).toMatchObject({
      formato: 'LINEAS_HOSPITALARIAS',
      numero: 'CS 45678',
      nitProveedor: '900294380',
    });
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'TORNILLO DE PRUEBA',
      cantidad: 2,
      codigoDeclarado: '',
      registroSanitario: '2025DM-0001234',
      lotesDeclarados: ['00000009'],
      lotesDocumento: [{ lote: '00000009', vencimiento: null }],
    });
  });
  it('usa el número de factura Biospifar y no el rango de autorización', () => {
    const f = leer(
      'BIOSPIFAR\nCon el prefijo FEM-40001 al FEM-45000\nFEM - 88888\n000123-01 J01XX09 PRODUCTO SINTETICO 0 % 50 100.00 5,000.00\nLote: 000AA Vcto: 12/31/2032\nSon:'
    );
    expect(f.numero).toBe('FEM - 88888');
    expect(f.renglones[0]).toMatchObject({
      cantidad: 50,
      codigoDeclarado: '000123-01',
      lotesDeclarados: ['000AA'],
      lotesDocumento: [{ lote: '000AA', vencimiento: '2032-12-31' }],
    });
  });
  it('separa CUM, IUM y resolución en Blau; los vitales no se consultan como registro', () => {
    const f = leer(
      'BLAU FARMACEUTICA COLOMBIA\n1 PRODUCTO\nMVND 1C1000000000001 L01BC01 2030001234 00001 05/2032 100,00 100,00'
    );
    expect(f.renglones[0]).toMatchObject({
      cantidad: 1,
      tipo: 'VITAL_NO_DISPONIBLE',
      codigoDeclarado: '',
      registroSanitario: '',
      lotesDeclarados: ['00001'],
      lotesDocumento: [{ lote: '00001', vencimiento: '2032-05' }],
    });
    expect(f.renglones[0].advertencias.join(' ')).toContain(
      'IUM declarado (no CUM): 1C1000000000001'
    );
    expect(f.renglones[0].advertencias.join(' ')).toContain('Resolución declarada: 2030001234');
    expect(f.renglones[0].advertencias.join(' ')).not.toContain('no aporta un registro');
  });
  it('conserva un CUM sin separador como declaración ambigua sin inventar expediente/consecutivo', () => {
    const f = leer(
      'FRESENIUS KABI COLOMBIA\nFV999999\n1993275401 000HEC 2032.01.02 1,600 PCE\tPRODUCTO\tCODE123\t1 0.00\t3,540 5,664,000'
    );
    expect(f.renglones[0]).toMatchObject({
      tipo: 'MEDICAMENTO',
      cantidad: 1600,
      codigoDeclarado: '1993275401',
      unidadMedida: 'PCE',
      lotesDeclarados: ['000HEC'],
      lotesDocumento: [{ lote: '000HEC', vencimiento: '2032-01-02' }],
    });
    expect(f.renglones[0].advertencias.join(' ')).toContain('sin separador');
    expect(f.renglones[0].advertencias.join(' ')).not.toContain('Seleccione el tipo');
  });
  it('Cardiomed usa la fecha de la factura y no el pie con formato mes/día; mantiene miles', () => {
    const f = leer(
      'INDUSTRIAS CARDIOMED\n987654\nVALLEDUPAR\n10 2030 D M A\t2031\t1\t29\t1\nDIA MES AÑO\n19 $\tCMD001\t12345\n2025DM-0001234\n100,000.00\nRegistro Sanitario INVIMA\nLote Venc. CANT.\n000LOT 17/09/2032\n1.500 Unidad $ 10,000.00\tMQ001 PRODUCTO\n1500\nImpreso por Fecha y Hora de Generacion: 10/01/2030'
    );
    expect(f.numero).toBe('FEP 987654');
    expect(f.fecha).toBe('2030-10-01');
    expect(f.renglones[0]).toMatchObject({
      cantidad: 1500,
      descripcion: 'PRODUCTO',
      codigoDeclarado: '',
      lotesDeclarados: ['000LOT'],
      lotesDocumento: [{ lote: '000LOT', vencimiento: '2032-09-17' }],
    });
  });
  it('BSN mantiene dos lotes del mismo renglón y solo usa su cantidad principal', () => {
    const f = leer(
      'BSN MEDICAL\nFE888888\n000010 1234567 PRODUCTO MULTILINEA\nCONTINUACIÓN\nLote: 000A F. Vto 20.12.2032 4 PC\nLote: 000B F. Vto 08.02.2033 44 PC\nReg.INVIMA N/A 2026DM-0000273-R2\nF.Vto15.10.2035\n48 33.003,00 1.584.144,00 0,00 0,00 1.584.144,00\nPag. 1 de 01'
    );
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 48,
      descripcion: 'PRODUCTO MULTILINEA CONTINUACIÓN',
      lotesDeclarados: ['000A', '000B'],
      codigoDeclarado: '',
      lotesDocumento: [
        { lote: '000A', vencimiento: '2032-12-20' },
        { lote: '000B', vencimiento: '2033-02-08' },
      ],
    });
  });
  it('RP usa el vencimiento del lote y excluye el del registro sanitario', () => {
    const f = leer(
      'RP MEDICAS S.A\nNo.FEM1 88888\n14,350,000.00\t350,000.00\t41.00\n000LOT 14/01/2031 Invima 2018DM-0002837-R1 F Vto 02/10/2028 ARGON\nREF123 PRODUCTO\nObservaciones:'
    );
    expect(f.renglones[0].lotesDocumento).toEqual([{ lote: '000LOT', vencimiento: '2031-01-14' }]);
  });
  it('mantiene un lote cuya fecha es inválida sin reemplazarla con el vencimiento comercial', () => {
    const f = leer(
      'BIOSPIFAR\nFEM - 88888\n000123-01 J01XX09 PRODUCTO SINTETICO 0 % 50 100.00 5,000.00\nLote: 000AA Vcto: 02/30/2032\nFecha de Vencimiento: 12/31/2033\nSon:'
    );
    expect(f.renglones[0].lotesDocumento).toEqual([{ lote: '000AA', vencimiento: null }]);
  });
  it.each([
    [
      'MAS SALUD I.P.S\nCUM\tDESCRIPCION\nPRODUCTO\nMARCA\t2025DM-0001234\t19\t80,00\t000A\t20320409\t18,000.00\t1,440,000.00',
      '000A',
      '2032-04-09',
    ],
    [
      'LIVANOVA COLOMBIA\n1\tREF123 PRODUCTO\nNo Lote : 000A Fecha Exp : 19-06-2032\t1\tUN\t1.000,00\t1.000,00',
      '000A',
      '2032-06-19',
    ],
    [
      'ROPSOHN THERAPEUTICS\n201080205 PRODUCTO\n68.400,00\t019935299-01 CJA\t4 000A 30/10/2032 5.198.400,00\t76,00\t1',
      '000A',
      '2032-10-30',
    ],
    [
      'AMAREY NOVA MEDICAL\n1 237913\t1,150,000.00 25,300,000.00\tPRODUCTO\nINVIMA 2025DM-0001072, ,\n000A 2032-04-30 22',
      '000A',
      '2032-04-30',
    ],
    [
      'LABORATORIOS RYAN DE COLOMBIA\n52,00 9.360.000,00\t180.000,00\tPRODUCTO\nATC: ABC\n1 Lote: 000A Fecha Venc.:\n31/10/2032\n230143-3\tCOD123',
      '000A',
      '2032-10-31',
    ],
    [
      'GE HEALTHCARE COLOMBIA\n12 12.048.600,00\t1.004.050\tPK\t1. PRODUCTO / CUM 22542-09\t1162462 000A 31/01/2032',
      '000A',
      '2032-01-31',
    ],
    [
      'ARROW MEDICAL\nPRODUCTO\tREF123 4,800,000\t24,000\t200 0%\nF.Vence: 02-02-2032\tLt: 000A P.Aranc.: 38.22.00.90.00\tINVIMA: 2025RD-0003978',
      '000A',
      '2032-02-02',
    ],
    [
      'FUNDACION CARDIOVASCULAR DE COLOMBIA\n32.31062 PRODUCTO 14-oct-2032 000A 40,00 47.100,00 8.949,00 1.884.000,00',
      '000A',
      '2032-10-14',
    ],
    [
      'BECTON DICKINSON COLOMBIA\n1\t600,00\t11.444,00\t6.866.400,00\tPRODUCTO Venc:\n2032-03-31\n000A\t405259\tEA\t1.304.615,00\t19%',
      '000A',
      '2032-03-31',
    ],
  ])(
    'conserva la pareja lote–vencimiento del renglón en formatos adicionales',
    (texto, lote, vencimiento) => {
      const f = leer(texto);
      expect(f.renglones).toHaveLength(1);
      expect(f.renglones[0].lotesDocumento).toEqual([{ lote, vencimiento }]);
    }
  );
  it('Imcolmédica excluye encabezados y fletes y no transforma códigos internos en CUM', () => {
    const f = leer(
      'IMCOLMEDICA\nNo. FVT888888\nDETALLES\nCód. Estandar Descripción Cantidad U. Medida Precio Unit. Desc. % Impuesto Impuesto Total Impuesto Total\n01003373 PRODUCTO\nMULTILINEA 24.00 94 100.00 0.00 IVA 19.00% IVAG01 456.00 2,400.00\nFL0001 FLETES 1.00 94 50.00 0.00 IVA 19.00% IVAG01 9.50 50.00\nLos códigos'
    );
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'PRODUCTO MULTILINEA',
      cantidad: 24,
      codigoDeclarado: '',
      lotesDeclarados: [],
    });
    expect(f.advertencias.join(' ')).toContain('cargo de flete');
  });
  it('mantiene identificadores vacíos y cantidad desconocida para revisión, sin inventar un cero', () => {
    const f = leer(
      'BSN MEDICAL\nFE111111\n000010 1234567 PRODUCTO SIN CANTIDAD\nLote: N/A F. Vto 20.12.2032 4 PC\nPag. 1'
    );
    expect(f.renglones[0]).toMatchObject({
      cantidad: null,
      codigoDeclarado: '',
      registroSanitario: '',
      lotesDeclarados: [],
    });
    expect(f.renglones[0].advertencias.join(' ')).toContain('cantidad válida');
  });
  it('los veinte perfiles son únicos y se detectan sin utilizar nombres de archivos', () => {
    expect(new Set(PERFILES_PDF_202611.map(p => p.id)).size).toBe(20);
    expect(leer('DOCUMENTO AJENO\nCÓDIGO 01234 LOTE 000A').formato).toBe('DESCONOCIDO');
  });
  it('avisa cuando el total declarado no coincide con los renglones recuperados', () => {
    const f = leer(
      'SHERLEG LABORATORIES\nFACTURA ELECTRONICA DE\nVENTA\n1\t10001\tPRODUCTO\tUNI\t8.00\t100.00\t800.00\nTotal Items\t2'
    );
    expect(f.renglones).toHaveLength(1);
    expect(f.advertencias.join(' ')).toContain('declara 2 renglones y se extrajeron 1');
  });
});
