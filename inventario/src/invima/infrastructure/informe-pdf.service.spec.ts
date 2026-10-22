import { Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { htmlInformeInvima, InformeInvimaPdfService } from './informe-pdf.service';
jest.mock('puppeteer', () => ({ launch: jest.fn() }));

describe('Informe PDF INVIMA', () => {
  const fixture = (): any => ({
    numero: 'F-1',
    proveedor: 'Proveedor',
    nitProveedor: '123',
    fecha: '2026-10-22',
    generadoEn: new Date('2026-10-22T18:30:00Z'),
    observacion: { texto: 'General\nSegunda línea', fecha: null },
    productos: [],
  });
  const navegador = () => {
    const page = {
      setJavaScriptEnabled: jest.fn(),
      setRequestInterception: jest.fn(),
      on: jest.fn(),
      setContent: jest.fn(),
      pdf: jest.fn(async () => new Uint8Array([37, 80, 68, 70])),
    };
    const browser = {
      newPage: jest.fn(async () => page),
      close: jest.fn(async () => undefined),
      process: () => ({ kill: jest.fn() }),
    };
    return { page, browser };
  };
  it('bloquea recursos externos, deshabilita scripts y cierra el navegador después del PDF', async () => {
    const { page, browser } = navegador();
    (puppeteer.launch as jest.Mock).mockResolvedValueOnce(browser);
    const result = await new InformeInvimaPdfService().generar(fixture());
    expect(result.toString()).toBe('%PDF');
    expect(page.setJavaScriptEnabled).toHaveBeenCalledWith(false);
    expect(page.setRequestInterception).toHaveBeenCalledWith(true);
    const abort = jest.fn();
    page.on.mock.calls[0][1]({ abort });
    expect(abort).toHaveBeenCalled();
    expect(browser.close).toHaveBeenCalledTimes(1);
  });
  it('cierra recursos y libera el cupo ante errores de impresión', async () => {
    const { page, browser } = navegador();
    page.pdf.mockRejectedValueOnce(new Error('Fallo de impresión'));
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const service = new InformeInvimaPdfService();
    await expect(service.generar(fixture())).rejects.toThrow('No se pudo generar');
    expect(browser.close).toHaveBeenCalledTimes(1);
    await expect(service.generar(fixture())).resolves.toBeInstanceOf(Buffer);
    logger.mockRestore();
  });
  it('limita la generación a dos informes simultáneos por proceso', async () => {
    const { page, browser } = navegador();
    let release: () => void;
    const wait = new Promise<void>(r => (release = r));
    page.pdf.mockImplementation(async () => {
      await wait;
      return new Uint8Array([37, 80, 68, 70]);
    });
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new InformeInvimaPdfService();
    const a = service.generar(fixture()),
      b = service.generar(fixture());
    await expect(service.generar(fixture())).rejects.toThrow('dos informes');
    release();
    await Promise.all([a, b]);
  });
  it('escapa todos los datos como texto y muestra las observaciones con saltos de línea', () => {
    const f = fixture();
    f.proveedor = '<script>alert(1)</script>';
    f.observacion.texto = '<img src="http://malicioso"> & nota';
    const html = htmlInformeInvima(f);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp; nota');
    expect(html).toContain('white-space:pre-wrap');
  });
  it('separa estado CUM del registro y no convierte candidatos pendientes en coincidencias', () => {
    const f = fixture();
    f.productos = [
      {
        orden: 1,
        datos: { tipo: 'MEDICAMENTO', descripcion: 'Producto', codigoDeclarado: '000001-01' },
        resultado: 'CONFIRMADA',
        observacion: { texto: 'Nota', fecha: null },
        candidato: {
          cum: '000001-02',
          nombre: 'Encontrado',
          estadoCum: 'Inactivo',
          estadoRegistro: 'Vigente',
        },
        verificacion: null,
      },
      {
        orden: 2,
        datos: { tipo: 'ALIMENTOS', descripcion: 'Alimento' },
        resultado: 'REVISION',
        observacion: { texto: '', fecha: null },
        candidato: null,
        verificacion: null,
      },
    ];
    const html = htmlInformeInvima(f);
    for (const text of [
      'Inactivo',
      'Vigente',
      '000001-01',
      '000001-02',
      'No aplica',
      'Requiere revisión',
      'Sin coincidencia asociada',
      'Nota',
    ])
      expect(html).toContain(text);
  });
});
