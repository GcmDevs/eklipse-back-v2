import { extraerFactura } from './factura.extractor';

describe('Cantidades de proveedores PDF adicionales', () => {
  it('Sicmafarma separa cantidad de precio, renglón, descuento y empaque incluso con descripción multilínea', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'SICMAFARMA\nFACTURA ELECTRÓNICA DE VENTA\n103425\n28-09-2026 15:44:07\n20148959-2 \tCJX5 \t30-01-2029\tLOTE\t3000004 \t0 \t95,675\tADENOTROY® 6mg/2mL (Adenosina), Ampolla \t19,135\t1 \t0\t5.00\nAuto/Reg. Invima: 2019M-0019333\t1A1001231002101\nN/A \tCJ X10 \t30-08-2028\tLOTE2\t605001011 \t0 \t836,000\tAZUL DE METILENO 50 MG/5 ML\nC10-MVND\n20,900\t16 \t0\t40.00\nAuto/Reg. Invima: Autorización\n2025001412-2025001913-2026000195\nTotal Cantidad: 45',
      },
    ]);
    expect(f.renglones.map(r => r.cantidad)).toEqual([5, 40]);
    expect(f.renglones[0]).toMatchObject({
      codigoDeclarado: '20148959-2',
      registroSanitario: '2019M-0019333',
    });
    expect(f.renglones[1]).toMatchObject({
      codigoDeclarado: 'N/A',
      registroSanitario: '',
      descripcion: 'AZUL DE METILENO 50 MG/5 ML C10-MVND',
    });
    expect(f.renglones[0].cantidadPresentacion).toBeUndefined();
  });
  it.each([
    ['0.00', 0],
    ['1,100.50', 1100.5],
    ['-4.00', null],
    ['', null],
  ] as const)(
    'Sicmafarma mantiene %s como %s sin leer el descuento como cantidad',
    (raw, expected) => {
      const f = extraerFactura([
        {
          num: 1,
          text: `SICMAFARMA\n20148959-2 \tCJX5 \t30-01-2029\tLOTE\t3000004 \t0 \t95,675\tPRODUCTO 6mg/2mL Ampolla \t19,135\t1 \t0${raw ? '\t' + raw : ''}\nAuto/Reg. Invima: 2019M-0019333\nTotal Cantidad:`,
        },
      ]);
      expect(f.renglones[0].cantidad).toBe(expected);
      if (expected === null)
        expect(f.renglones[0].advertencias.join(' ')).toContain('cantidad válida');
    }
  );
  it('Vantive toma la cantidad despachada aun con IVA, CUM ausente y página de totales', () => {
    const header =
      'VANTIVE S.A.S.\nFACTURA ELECTRÓNICA DE VENTA\nNo. 22495\n2026/10/16 15:52:20\nVALOR TOTAL\n';
    const f = extraerFactura([
      {
        num: 1,
        text:
          header +
          '1.- PRISMAFLEX SET EA 20,00\t29-02-28\tLOTE\t107144 // 1.836.433,00 36.728.660\n2.- EFFLUENT BAG EA 120,00\t19.00\t29-01-19\t2604\t115959 // 36.338,00 4.360.560\nIMPORTANTE: condiciones',
      },
      { num: 2, text: header + 'Total Nro Líneas: 2' },
    ]);
    expect(f.renglones.map(r => r.cantidad)).toEqual([20, 120]);
    expect(f.renglones.every(r => r.codigoDeclarado === '' && r.unidadMedida === 'EA')).toBe(true);
  });
  it('Delta lee unidades en miles sin dividir por caja ni usar el IUM como CUM', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'LABORATORIOS DELTA\nNo. FE53153\n2.760\t1T10034410081\n00\n6.312.120,00\tLOTE 28-02-2029\t$2.287\t1\tINVIMA 2022M-0020635\tCaja x 10 amp.\tACITRADELT (ACIDO TRANEXAMICO) 500 Mg\nUD\nTel: 123',
      },
    ]);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 2760,
      unidadMedida: 'UD',
      codigoDeclarado: '',
    });
    expect(f.renglones[0].advertencias.join(' ')).toContain('IUM');
  });
  it('Cruz Verde conserva cantidades de la columna principal, CUM y unidad sin sumar lotes', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'DROGUERIAS Y FARMACIAS CRUZ VERDE\nMEDIO DE PAGO\n5 851.728,00 4.258.640,00\t112942 JRP 0,00 0,00 0,00\tELIGARD CUM:19956218-04\nCANTIDAD 2 / LOTE1 / 30-03-2027\nCANTIDAD 3 / LOTE2 / 30-04-2027\n1.\nLineas facturadas: 1',
      },
    ]);
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 5,
      unidadMedida: 'JRP',
      codigoDeclarado: '19956218-04',
    });
  });
  it('B. Braun conserva cantidad principal y no convierte referencia, expediente o lotes en CUM', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'B. Braun Medical\nItem\tCantidad\tValor unitario\n1\t10\t675.600\t6.756.000\tPRODUCTO ESTERIL\nGP312R\tUN\t19%\nReg. Sanitario INVIMA 2018DM-0017953\t20144345\nLote: No.:\tVence:\tLOTE1\t10052031\t4\tCant:\nLote: No.:\tVence:\tLOTE2\t10052031\t6\tCant:\nCarrera 19 No. 100-45',
      },
    ]);
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 10,
      unidadMedida: 'UN',
      codigoDeclarado: '',
      registroSanitario: '2018DM-0017953',
    });
  });
});
