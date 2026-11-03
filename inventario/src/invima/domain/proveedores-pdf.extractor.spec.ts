import { extraerFactura } from './factura.extractor';
import { cantidadRenglonPdf } from './proveedores-pdf.extractor';
import { RenglonExtraido } from './factura.models';

describe('Cantidades PDF por proveedor', () => {
  it('Farmalógica distingue cantidad de precio, número de renglón, IUM y empaque', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: `FARMALOGICA S.A.\nFACTURA ELECTRONICA DE VENTA No. 97840\nFecha de Generacion: 28-agosto-2026\n1.900\t1110726 / 31-may.-2029\tAMPICILINA 1.5g (10 UNID. X PLEGADIZA)\nATC J01CR01 / RS INVIMA 2023M-0001779-R3 / IUM 2A1016711006100\n1 11.100 21.090.000\t019931216-05\nPREPARADA POR:`,
      },
    ]);
    expect(f).toMatchObject({ formato: 'FARMALOGICA', numero: 'FE 97840', fecha: '2026-08-28' });
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 11100,
      codigoDeclarado: '019931216-05',
      registroSanitario: '2023M-0001779-R3',
      descripcion: 'AMPICILINA 1.5g (10 UNID. X PLEGADIZA)',
    });
  });
  it('Alfa Trading conserva cada renglón por lote y las unidades facturadas sin multiplicar cajas', () => {
    const header = 'ALFA TRADING\nINST - 259080\nFECHA DE GENERACION: 14/10/2026\n';
    const f = extraerFactura([
      {
        num: 1,
        text:
          header +
          'ORBM002 BAJALENGUA (Paquete x 100) 30/12/2030 NO REQUIERE caj x100 $3,800\tLOTE1 10 $38,000\t19\nGUNA009 GUANTE 30/03/2031 2017DM-0016700 Caj x 100 $11,500\tLOTE2 110 $1,265,000\t19\nAutorizacion numeracion',
      },
      {
        num: 2,
        text:
          header +
          'GUNA009 GUANTE 30/03/2031 2017DM-0016700 Caj x 100 $11,500\tLOTE3 20 $230,000\t19\nAutorizacion numeracion',
      },
    ]);
    expect(f.renglones.map(r => r.cantidad)).toEqual([10, 110, 20]);
    expect(f.renglones[0]).toMatchObject({
      tipo: 'DISPOSITIVO',
      codigoDeclarado: '',
      unidadMedida: 'caj x100',
      registroSanitario: '',
    });
    expect(f.renglones[2].paginas).toEqual([2]);
  });
  it('Medtronic conserva lotes por renglón, cantidad y referencia solo como evidencia', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'Medtronic Colombia S.A.\nMDTC 4128941436\nORIGINAL\n27-Agosto-2026 - 10:43\n3.330.606\tDBM T43110INT 10CC GRAFTON\nPUTTY U.M 1 EA = 1 EA\n3.330.606\tA77459-120 1 0%\tT43110INT\n00643169965003\n1 20/07/2029 0\n3.330.606\tDBM T43110INT 10CC GRAFTON\nPUTTY U.M 1 EA = 1 EA\n3.330.606\tA77459-121 1 0%\tT43110INT\n00643169965003\n2 20/07/2029 0\nPage 1 of 2',
      },
      {
        num: 2,
        text: 'Medtronic Colombia S.A.\nMDTC 4128941436\nVALOR EN LETRAS\nTotal Lineas: 2',
      },
    ]);
    expect(f.renglones).toHaveLength(2);
    expect(f.renglones.map(r => r.cantidad)).toEqual([1, 1]);
    expect(f.renglones.every(r => r.codigoDeclarado === '' && r.registroSanitario === '')).toBe(
      true
    );
    expect(f.renglones[0].fragmento).toContain('T43110INT');
  });
  it('Baxter recupera la cantidad despachada con separador colombiano y CUM opcional', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'LABORATORIOS BAXTER\nFACTURA ELECTRÓNICA DE VENTA\nNo. 95361604\n2026/07/27 19:04:26\nVALOR TOTAL\n1.- EPUMP BAG 1000 ML EA 2.700,00\t28-12-31\tLOTE\tREF // 18.000,00 COP 48.600.000 COP\nTotal Nro Líneas: 1',
      },
    ]);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 2700,
      unidadMedida: 'EA',
      descripcion: 'EPUMP BAG 1000 ML',
      codigoDeclarado: '',
    });
  });
  it('Surgicon toma la columna cantidad, sin sumar de nuevo los lotes ni usar GTIN', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'SURGICON & CIA. S.A.S.\nFACTURA ELECTRÓNICA DE\nVENTA\n123786\nFECHA GENERACIÓN\n02/10/2026 16:30:41\nTO1110 NAR 1. AGUJA 11GX10CM - GTIN\nNo. 08033860002435. LOTE(s):\n__4 x LOTE: A VENCE: DIC 2/30 INVIMA 2021DM-0007448-R1\n__6 x LOTE: B VENCE: DIC 2/30 INVIMA 2021DM-0007448-R1\n10 199,090.00 IVA 19.00 378,271.00 1,990,900.00\nTotal Nro Líneas: 1',
      },
    ]);
    expect(f.renglones).toHaveLength(1);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 10,
      descripcion: 'AGUJA 11GX10CM',
      codigoDeclarado: '',
      unidadMedida: 'NAR',
    });
  });
  it('Cafam reconstruye descripciones multilínea y conserva cantidad sin inferir CUM de códigos internos', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'CAJA DE COMPENSACION FAMILIAR CAFAM\nFACTURA ELECTRÓNICA DE VENTA SD2710017753\nAREA VENTAS FECHA EMISION\n01/07/2025 15:05:28\n48008571 10. V.I CIPROFLOXACINO CAJ 100\nUN\n12 NAR 26,000 312,000 IVA 0.00 0 312,000\nCUFE: prueba',
      },
      {
        num: 2,
        text: 'CAJA DE COMPENSACION FAMILIAR CAFAM\n48020109 17. PRODUCTO CAJ 30\n0 NAR 16,904 0 IVA 0.00 0 0\nTotal Nro Líneas: 2',
      },
    ]);
    expect(f.renglones.map(r => r.cantidad)).toEqual([12, 0]);
    expect(f.renglones[0]).toMatchObject({
      descripcion: 'V.I CIPROFLOXACINO CAJ 100 UN',
      codigoDeclarado: '',
      registroSanitario: '',
      tipo: 'SIN_CLASIFICAR',
    });
  });
  it('L.M. Instruments no usa el rango DIAN ni el precio o el número de renglón como cantidad', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'L.M INSTRUMENTS S.A\nHabilita rangos LM 450001 al LM 600000\n20 10 2026\nLM 461632\nLM-86-60152M L.M. INSTRUMENTS Resucitador neonatal\n2023DM-0027088 Ref. 60152M\n20260126011\n06/04/2029\n3,213,000\t64,260\t50\t1\n1\tTotal Lineas',
      },
    ]);
    expect(f.numero).toBe('LM 461632');
    expect(f.renglones[0]).toMatchObject({
      cantidad: 50,
      codigoDeclarado: '',
      registroSanitario: '2023DM-0027088',
    });
  });
  it('Vygon conserva el registro original, el CUM vacío y cantidades con decimales anglosajones', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: '00027003 Cat. Umbilical 3.5Fr. x 37cm. 15.00 6,120.00 91,800.00\nLote No. : A Vencimiento:\nUnd\n26/01/2031\nCAT. UMBILICAL\nNo. INVIMA: 2024DM-0012392 – R1\n0\nSUBTOTAL RETEFUENTE\nVYGON COLOMBIA S.A.S. FECHA / DATE:\nVendedor(a) / Seller :\n28/09/2026\nFACTURA ELECTRÓNICA DE VENTA / INVOICE No: 101134365',
      },
    ]);
    expect(f.renglones[0]).toMatchObject({
      cantidad: 15,
      unidadMedida: 'Und',
      codigoDeclarado: '',
      registroSanitario: '2024DM-0012392 – R1',
    });
  });
  it.each([
    ['es', '1.500,25', 1500.25],
    ['en', '1,500.25', 1500.25],
    ['es', '0', 0],
    ['en', '0.00', 0],
    ['es', '-5', null],
    ['es', '1,2,3', null],
    ['en', undefined, null],
    ['en', '10 cajas', null],
  ] as const)(
    'interpreta cantidades %s %s sin cambiar vacíos o inválidos a cero',
    (locale, raw, expected) => {
      const r = { advertencias: [] } as RenglonExtraido;
      expect(cantidadRenglonPdf(r, raw, locale).cantidad).toBe(expected);
      if (expected === null) expect(r.advertencias).toHaveLength(1);
    }
  );
  it('Xinetix lee la cantidad junto al precio sin usar el CUM ni el detalle de lotes', () => {
    const f = extraerFactura([
      {
        num: 1,
        text: 'XINETIX\n1 101 PRODUCTO\nLote - Fech Ven - Cantidad\nCUM: 000123-01\n10 $100\nTotal Items: 1',
      },
    ]);
    expect(f.renglones[0].cantidad).toBe(10);
  });
});
