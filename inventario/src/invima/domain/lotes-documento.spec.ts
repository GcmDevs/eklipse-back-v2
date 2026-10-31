import { extraerLotesPdf } from './lotes-documento';
import { extraerFactura } from './factura.extractor';
import { extraerPedidoDisfarma } from './pedido-excel.extractor';
describe('Lotes declarados en documentos', () => {
  it.each([
    ['FARMALOGICA', '1.900\t0010726 / 31-may.-2029\tPRODUCTO', '0010726'],
    ['ALFA_TRADING', 'PRODUCTO $3,800\tDL1520A 10 $38,000\t19', 'DL1520A'],
    ['MEDTRONIC', '3.330.606\tA77459-120 1 0%\tT43110INT', 'A77459-120'],
    ['BAXTER', 'EA 880,00\t30-12-31\t26A29V182\tAMC9607C', '26A29V182'],
    ['VANTIVE', 'EA 20,00\t29-02-28\t26C0031\t107144', '26C0031'],
    ['SURGICON', '__10 x LOTE: 25123601 VENCE: DIC 2/30', '25123601'],
    ['LM_INSTRUMENTS', 'Ref. 60152M\n20260126011\n06/04/2029\nPRECIO', '20260126011'],
    ['VYGON', 'Lote No. : 050226BB Vencimiento:\nUnd\n05/02/2031', '050226BB'],
    ['SEVEN_PHARMA', 'Lote:\nFD256566\nCantidad Lote:\n49,00', 'FD256566'],
    ['GRUPO_AFIN', '0%\t04/11/2026\t6244A $ 5,751,262', '6244A'],
    ['VITALIS', 'A260442\nVence:\n21.06.2028\nPRODUCTO', 'A260442'],
    ['B_BRAUN', 'Lote: No.: \tVence:\t53078631 \t21062031 \t1\tCant:', '53078631'],
    ['LIFE', 'LOTE: VENCE:\tCANT: CUM:\t000225 7,100.00 30/12/2030 20220067', '000225'],
    ['SICMAFARMA', '20148959-2 \tCJX5 \t30-01-2029\t25.10.6583\t3000004', '25.10.6583'],
    ['CRUZ_VERDE', 'CANTIDAD 5 / 15487CC0 / 30-03-2027', '15487CC0'],
    ['DELTA', '6.312.120,00\t263212015 28-02-2029 \t$2.287', '263212015'],
    ['XINETIX', 'Lote - Fech Ven - Cantidad\n7Z10015A - 2027-12-31 - 5 , RS: 2022M-1', '7Z10015A'],
    ['OFFIMEDICAS', 'Cum ( 20004887-4 ) Invima ( 2020M-1 ) Lote 001025\nVence 09/27', '001025'],
    ['EVEDISA', 'LOTE: 25K06214 FECHA VENC: 20280930', '25K06214'],
  ])('lee lote de %s sin mezclar códigos o cantidades', (f, t, l) =>
    expect(extraerLotesPdf(f, t)).toEqual([l])
  );
  it('no interpreta códigos internos, fechas o cantidad de lote como lotes', () => {
    expect(extraerLotesPdf('CAFAM', '48084764 1. ACETAMINOFEN 800 NAR 2,000')).toEqual([]);
    expect(extraerLotesPdf('SEVEN_PHARMA', 'Cantidad Lote:\n49,00\nCUM: 000123-01')).toEqual([]);
  });
  it('conserva varios lotes Life por producto, sin duplicar renglones', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'LIFE SUMINISTROS\nActividad ICA 203 10,00x mil 98063\nDM12345 EQUIPO 750.00\t1000.00\nLOTE: VENCE: CANT: CUM: 001A 715.00 30/04/2029 20252482\nLOTE: VENCE: CANT: CUM: 002B 35.00 19/03/2031 20252482\nPor favor abstenerse',
      },
    ]);
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0].lotesDeclarados).toEqual(['001A', '002B']);
  });
  it('Excel usa exclusivamente encabezados de lote; conserva ceros, varios lotes y evita fórmulas', () => {
    const rows = [
      ['PEDIDO NO. 123'],
      ['Descripción', 'CUM', 'INVIMA', 'Fecha Vence', 'LOTE_PRODUCTO'],
      ['Producto', '0001-01', '2020M-1', '02N1C2', '001A;002B'],
      ['Otro', '0002-01', '2020M-2', '06C1E3', ''],
      ['Otro', '0003-01', '2020M-3', '', 'formula'],
    ];
    const h = {
      nombre: 'Pedido',
      filas: rows.map((r, i) => ({
        numero: i + 1,
        celdas: r.map((texto, j) => ({ texto, ...(i === 4 && j === 4 ? { formula: true } : {}) })),
      })),
    };
    const f = extraerPedidoDisfarma([h]);
    expect(f.renglones.map(r => r.lotesDeclarados)).toEqual([['001A', '002B'], [], []]);
    expect(f.renglones[2].advertencias.join(' ')).toContain('fórmulas');
  });
});
