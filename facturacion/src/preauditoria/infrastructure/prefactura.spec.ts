import { jsPDF } from 'jspdf';
import { Actor, PacienteIngreso } from '../domain/modelo';
import { importeColombiano, leerPrefactura, MAX_PDF_PRE, PrefacturasPre } from './prefactura';
const paciente = { ingreso: '1234', documento: '00123456' } as PacienteIngreso;
const texto =
  'PREFACTURA DE SERVICIOS\nIngreso: 1234\nDocumento: CC 00123456\nSubtotal: 99.000.000,00\nValor neto a pagar: $ 1.234.567,89';
describe('Lectura de prefacturas', () => {
  it('conserva ceros iniciales e interpreta documentos con puntos', () => {
    expect(
      leerPrefactura(texto.replace('CC 00123456', 'CC: 00.123.456'), paciente).identidadCompleta
    ).toBe(true);
  });
  it('no confunde el documento contable con la identificación del paciente', () => {
    expect(
      leerPrefactura(texto.replace('Documento: CC 00123456', 'Documento: 555555'), paciente)
        .identidadCompleta
    ).toBe(false);
  });
  it.each([
    ['1.234.567,89', 1234567.89],
    ['1,234,567.89', 1234567.89],
    ['1234,56', 1234.56],
    ['1.234', 1234],
    ['0', 0],
    ['1.234,567', null],
  ])('interpreta %s sin perder separadores', (v, n) =>
    expect(importeColombiano(String(v))).toBe(n)
  );
  it('elige etiquetas de neto en lugar del importe mayor', () => {
    const r = leerPrefactura(texto, paciente);
    expect(r.neto).toBe(1234567.89);
    expect(r.identidadCompleta).toBe(true);
  });
  it('devuelve ambigüedad para netos diferentes y permite repetidos idénticos', () => {
    expect(leerPrefactura(texto + '\nTotal neto: 100,00', paciente).neto).toBeNull();
    expect(leerPrefactura(texto + '\nTotal neto: 1.234.567,89', paciente).neto).toBe(1234567.89);
  });
  it('no interpreta la fecha de ingreso como su identificador', () => {
    const r = leerPrefactura(
      'PREFACTURA DIGITAL\nFecha de ingreso: 2026-10-01\nTotal neto: 100,00',
      paciente
    );
    expect(r.identidadCompleta).toBe(false);
    expect(r.neto).toBe(100);
  });
  it('bloquea discrepancias explícitas y documentos sin texto', () => {
    expect(() => leerPrefactura(texto.replace('1234\n', '9999\n'), paciente)).toThrow(
      'no coincide'
    );
    expect(() => leerPrefactura(texto.replace('CC 00123456', 'CC 87654321'), paciente)).toThrow(
      'no coincide'
    );
    expect(() => leerPrefactura('', paciente)).toThrow('texto digital');
  });
});
describe('PDF real, procesado exclusivamente en memoria', () => {
  let lector: PrefacturasPre;
  const a: Actor = { id: 1, nombre: 'Prueba', contexto: 'ALTACENTRO', permisos: ['admin'] };
  beforeEach(() => (lector = new PrefacturasPre()));
  afterEach(() => lector.onModuleDestroy());
  function archivo(doc: jsPDF): Express.Multer.File {
    return { buffer: Buffer.from(doc.output('arraybuffer')) } as Express.Multer.File;
  }
  it('extrae un PDF digital y vincula el análisis a usuario y contexto', async () => {
    const doc = new jsPDF();
    doc.text(texto, 10, 20);
    const r = await lector.analizar(a, paciente, archivo(doc));
    expect(r.neto).toBe(1234567.89);
    expect(r.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r).not.toHaveProperty('texto');
    expect(r).not.toHaveProperty('buffer');
    expect(() => lector.obtener({ ...a, id: 2 }, r.id)).toThrow('venció');
    expect(() => lector.obtener({ ...a, contexto: 'SANJUAN' }, r.id)).toThrow('venció');
    lector.consumir(r.id);
    expect(() => lector.obtener(a, r.id)).toThrow('venció');
  });
  it('rechaza PDFs vacíos, dañados, protegidos y demasiado grandes', async () => {
    await expect(lector.analizar(a, paciente, archivo(new jsPDF()))).rejects.toThrow(
      'texto digital'
    );
    await expect(
      lector.analizar(a, paciente, { buffer: Buffer.from('%PDF-roto') } as Express.Multer.File)
    ).rejects.toThrow('No se pudo leer');
    const protegido = new jsPDF({
      encryption: { userPassword: 'secreto', ownerPassword: 'administrador' },
    });
    protegido.text(texto, 10, 20);
    await expect(lector.analizar(a, paciente, archivo(protegido))).rejects.toThrow(
      'No se pudo leer'
    );
    await expect(
      lector.analizar(a, paciente, { buffer: Buffer.alloc(MAX_PDF_PRE + 1) } as Express.Multer.File)
    ).rejects.toThrow('20 MB');
  });
});
