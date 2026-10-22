import { jsPDF } from 'jspdf';
import { PdfExtractorService } from './pdf-extractor.service';
const makePdf = (text = '', pages = 1) => {
  const doc = new jsPDF();
  for (let i = 0; i < pages; i++) {
    if (i) doc.addPage();
    if (text) doc.text(text, 10, 20);
  }
  return Buffer.from(doc.output('arraybuffer'));
};
describe('Extracción PDF aislada en worker', () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });
  it('rechaza archivos ajenos a PDF y archivos dañados', async () => {
    const service = new PdfExtractorService();
    await expect(service.extraer(Buffer.from('texto'))).rejects.toMatchObject({ status: 400 });
    await expect(service.extraer(Buffer.from('%PDF-1.4\nincorrecto'))).rejects.toMatchObject({
      response: { code: 'PDF_DANADO' },
    });
  });
  it('distingue un PDF sin texto de un resultado sin coincidencias', async () => {
    await expect(new PdfExtractorService().extraer(makePdf())).rejects.toMatchObject({
      response: { code: 'PDF_SIN_TEXTO' },
    });
  });
  it('limita páginas y tamaño antes de interpretar los productos', async () => {
    process.env.INVIMA_PDF_MAX_PAGES = '1';
    await expect(new PdfExtractorService().extraer(makePdf('texto', 2))).rejects.toMatchObject({
      response: { code: 'PDF_LIMITE_PAGINAS' },
    });
    process.env.INVIMA_PDF_MAX_BYTES = '30';
    await expect(new PdfExtractorService().extraer(makePdf())).rejects.toMatchObject({
      status: 413,
    });
  });
  it('termina el worker al vencer el plazo y permite volver a procesar', async () => {
    const service = new PdfExtractorService();
    process.env.INVIMA_PDF_TIMEOUT_MS = '1';
    await expect(service.extraer(makePdf('texto'))).rejects.toMatchObject({
      response: { code: 'PDF_TIEMPO_AGOTADO' },
    });
    delete process.env.INVIMA_PDF_TIMEOUT_MS;
    expect((await service.extraer(makePdf('Proveedor de ejemplo'))).formato).toBe('DESCONOCIDO');
  });
  it('identifica PDF protegido', async () => {
    const doc = new jsPDF({ encryption: { userPassword: 'prueba', ownerPassword: 'propietario' } });
    doc.text('Privado', 10, 20);
    await expect(
      new PdfExtractorService().extraer(Buffer.from(doc.output('arraybuffer')))
    ).rejects.toMatchObject({ response: { code: 'PDF_PROTEGIDO' } });
  });
  it('limita las extracciones concurrentes sin bloquear solicitudes futuras', async () => {
    const service = new PdfExtractorService();
    const a = service.extraer(makePdf('texto'));
    const b = service.extraer(makePdf('texto'));
    await expect(service.extraer(makePdf('texto'))).rejects.toMatchObject({ status: 429 });
    await Promise.all([a, b]);
    expect((await service.extraer(makePdf('texto'))).formato).toBe('DESCONOCIDO');
  });
  it('limita los renglones extraídos sin descartar parte de la factura', async () => {
    process.env.INVIMA_PDF_MAX_ROWS = '1';
    const text =
      'LIFE SUMINISTROS\nDM16023 GUANTE TALLA M 10.00 750.00\nDM16024 GUANTE TALLA S 20.00 750.00';
    await expect(new PdfExtractorService().extraer(makePdf(text))).rejects.toMatchObject({
      status: 413,
    });
  });
});
