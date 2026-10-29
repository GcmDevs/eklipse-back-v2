import JSZip = require('jszip');
import { DocumentosPre, xlsxPre } from './documentos';
import { actorPrueba, auditoriaPrueba } from '../testing/fixtures';
describe('Documentos regenerables', () => {
  it('mantiene tres decimales en cantidades y dos en importes', async () => {
    const zip = await JSZip.loadAsync(
      await xlsxPre([
        {
          nombre: 'Prueba',
          encabezados: ['Cantidad', 'Valor'],
          moneda: [1],
          filas: [[1.125, 112.64]],
        },
      ])
    );
    const hoja = await zip.file('xl/worksheets/sheet1.xml').async('string');
    expect(hoja).toContain('<c r="A2" s="0"><v>1.125</v></c>');
    expect(hoja).toContain('<c r="B2" s="2"><v>112.64</v></c>');
  });
  it('genera XLSX con todos los ingresos, incluidos los que no tienen hallazgos', async () => {
    const a = auditoriaPrueba(),
      b = auditoriaPrueba({
        paciente: { ...a.paciente, ingreso: '9999', nombre: '=HYPERLINK("ejemplo")' },
      });
    const zip = await JSZip.loadAsync(await new DocumentosPre().excel([a, b]));
    const libro = await zip.file('xl/workbook.xml').async('string');
    expect(libro).toContain('Ingresos');
    expect(libro).toContain('Hallazgos');
    const ingresos = await zip.file('xl/worksheets/sheet1.xml').async('string');
    expect(ingresos).toContain('9999');
    expect(ingresos).toContain('1234');
    expect(ingresos).toContain('inlineStr');
    expect(ingresos).not.toContain('<f>');
  });
  it('genera PDF en memoria de una instantánea y verifica el propietario de la vista previa', () => {
    const d = new DocumentosPre(),
      r = auditoriaPrueba({ estado: 'Finalizado', revision: 1 });
    const b = d.auditoria({
      id: r.id,
      auditoriaId: r.id,
      numero: 1,
      fecha: r.actualizado,
      responsable: r.responsable,
      formato: 1,
      auditoria: r,
    });
    expect(Buffer.isBuffer(b)).toBe(true);
    expect(b.subarray(0, 5).toString()).toBe('%PDF-');
    const token = d.autorizar(actorPrueba, r.id, 1);
    expect(() => d.comprobar({ ...actorPrueba, id: 99 }, r.id, 1, token)).toThrow();
    expect(() => d.comprobar({ ...actorPrueba, contexto: 'SANJUAN' }, r.id, 1, token)).toThrow();
    expect(() => d.comprobar(actorPrueba, r.id, 2, token)).toThrow();
    expect(() => d.comprobar(actorPrueba, r.id, 1, token)).not.toThrow();
  });
});
