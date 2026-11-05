import { Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { htmlInformeInvima, InformeInvimaPdfService } from './informe-pdf.service';
import { compararRecepcion, fisicoVacio } from '../domain/recepcion.models';
import { calcularMuestreo } from '../../recepcion-tecnica/inspeccion';
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
  it('identifica los pedidos y su cliente sin presentarlos como facturas de proveedor', () => {
    const f = { ...fixture(), tipoDocumento: 'PEDIDO', cliente: 'Disfarma', proveedor: '' };
    const html = htmlInformeInvima(f);
    expect(html).toContain('Pedido <strong>F-1</strong>');
    expect(html).toContain('Cliente: Disfarma');
    expect(html).toContain('Fecha de pedido');
    expect(html).not.toContain('Factura <strong>');
  });
  it('muestra unidades y presentaciones separadas y conserva cantidades cero', () => {
    const f = fixture();
    f.productos = [
      {
        orden: 1,
        datos: { descripcion: 'Producto', cantidad: 42, cantidadPresentacion: 3 },
        resultado: 'PENDIENTE',
        observacion: { texto: '' },
      },
      {
        orden: 2,
        datos: { descripcion: 'Cero', cantidad: 0, unidadMedida: 'caj x100' },
        resultado: 'PENDIENTE',
        observacion: { texto: '' },
      },
    ];
    const html = htmlInformeInvima(f);
    expect(html).toContain('Unidades: 42 · Presentaciones: 3');
    expect(html).toContain('Cantidad: 0 caj x100');
  });
  it('usa tabla con encabezados repetibles, comparte fuentes y conserva notas largas sin repetir vacíos', () => {
    const f = fixture();
    const source = { nombre: 'CUM vigentes', dataset: 'i7cb-raxc' };
    f.productos = Array.from({ length: 2 }, (_, i) => ({
      orden: i + 1,
      datos: {
        tipo: 'MEDICAMENTO',
        descripcion: 'Producto ' + i,
        codigoDeclarado: '0001-0' + i,
        registroSanitario: '',
      },
      resultado: 'INCOMPLETA',
      observacion: { texto: i ? 'Nota extensa\n'.repeat(180) + 'FIN_NOTA' : '', fecha: null },
      candidato: null,
      verificacion: {
        fecha: new Date(),
        usuarioNombre: 'Revisor',
        fuentes: [{ ...source, error: i ? 'Fallo' : undefined }],
        advertencias: ['Discrepancia conservada'],
      },
    }));
    const html = htmlInformeInvima(f);
    expect(html).toContain('<thead>');
    expect(html).toContain('display:table-header-group');
    expect(html.match(/CUM vigentes \(i7cb-raxc\)/g)).toHaveLength(1);
    expect(html.match(/Sin observaciones\./g) || []).toHaveLength(0);
    expect(html).toContain('FIN_NOTA');
    expect(html).toContain('product-long');
    expect(html).toContain('consulta fallida');
    expect(html).toContain('(Vacío)');
    expect(html).toContain('Discrepancia conservada');
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

  const conRecepcion = () => {
    const f = fixture();
    const datos = {
      tipo: 'MEDICAMENTO',
      descripcion: 'Medicamento de prueba',
      cantidad: 50,
      unidadMedida: 'UD',
      codigoDeclarado: '0000123-01',
      registroSanitario: '2025M-123',
      lotesDeclarados: ['000LOTE-A'],
      lotesDocumento: [{ lote: '000LOTE-A', vencimiento: '2029-04' }],
    };
    const fisico = {
      ...fisicoVacio('MEDICAMENTO'),
      descripcion: 'Medicamento físico',
      cantidad: 60,
      codigoDeclarado: '0000122-01',
      registroSanitario: '2025M-123',
      cantidadAveria: 2,
      cantidadNoSolicitada: 1,
      estadoEmpaque: 'DETERIORADO',
      riesgo: 'III',
      marca: 'Marca física',
      concentracion: '500',
      unidadConcentracion: 'mg',
      temperatura: 22,
      laboratorio: 'Fabricante físico',
      presentacion: 'Caja física',
      formaFarmaceutica: 'Tableta física',
      registroSanitarioRevisado: true,
      etiquetaConforme: true,
      sellosConformes: false,
      fabricanteConforme: false,
      motivosRechazo: ['CUM', 'INVIMA'],
      lotes: [
        { cantidad: 30, lote: '000lote-a', vencimiento: '2027-01-01' },
        { cantidad: 30, lote: '000LOTE-X', vencimiento: '2027-02-01' },
      ],
    };
    f.productos = [
      {
        renglonId: 101,
        orden: 1,
        datos,
        datosProducto: {
          laboratorio: 'Laboratorio ingresado',
          formaFarmaceutica: 'Forma ingresada',
        },
        resultado: 'EXACTA',
        candidato: {
          cum: '123-1',
          registroSanitario: 'INVIMA 2025M-123',
          titular: 'Titular oficial',
          estadoCum: 'Inactivo',
          estadoRegistro: 'Vigente',
          presentacion: 'Caja oficial',
          formaFarmaceutica: 'Tableta oficial',
        },
        observacion: { texto: 'Observación por producto', fecha: null },
        verificacion: {
          fecha: '2026-11-03T18:00:00Z',
          usuarioNombre: 'Inspector oficial',
          fuentes: [],
          advertencias: [],
        },
      },
    ];
    f.recepcion = {
      id: 1,
      facturaId: 1,
      estado: 'FINALIZADA',
      version: 4,
      creadoPor: 8,
      actualizadoPor: 9,
      fechaCreacion: '2026-11-03T17:00:00Z',
      fechaActualizacion: '2026-11-03T18:00:00Z',
      fechaFinalizacion: '2026-11-03T18:30:00Z',
      renglones: [
        {
          id: 201,
          facturaItemId: 101,
          version: 3,
          usuarioId: 9,
          fecha: '2026-11-03T18:00:00Z',
          facturado: datos,
          fisico,
          decision: 'RECHAZADO',
          justificacion: 'CUM diferente y averías',
          diferencias: compararRecepcion(datos as any, fisico as any),
          muestreo: calcularMuestreo(60, 0),
          borrador: null,
        },
      ],
    };
    return f;
  };
  it('incluye comparación, lotes, conservación, novedades, controles y decisión sin confundir estados oficiales', () => {
    const html = htmlInformeInvima(conRecepcion());
    for (const s of [
      'Informe de recepción técnica',
      'Finalizada',
      'Factura validada',
      'Recibido físicamente',
      'INVIMA · Factura',
      '50 UD',
      '60',
      'Faltante',
      'Sobrante',
      'Avería · unidades dañadas',
      'No solicitado',
      'Deteriorado',
      '0000123-01',
      '0000122-01',
      '123-1',
      'Difiere',
      '000lote-a',
      '000LOTE-A · Vence: 2029-04',
      '000LOTE-X',
      '2027-02-01',
      'Coincide con la factura',
      'No coincide con la factura',
      'Clasificación de riesgo',
      'Marca física',
      '22 °C',
      'Laboratorio ingresado',
      'Fabricante físico',
      'Titular oficial',
      'Forma ingresada',
      'Tableta física',
      'Tableta oficial',
      'Registro sanitario verificado en la base de datos INVIMA',
      'Etiquetas del producto revisadas',
      'Ortografía y sellos de seguridad revisados',
      'Fabricante corresponde al expediente sanitario',
      'Muestreo: E',
      'Muestra: 13',
      'Errores críticos: 0',
      'Por CUM, Por INVIMA',
      'CUM diferente y averías',
      'Observación por producto',
      'Usuario ID 9',
    ])
      expect(html).toContain(s);
    expect(html).toContain('rt-badge danger">Inactivo');
    expect(html).toContain('rt-badge success">Vigente');
    expect(html).not.toContain('INFORME EN CURSO');
  });
  it('separa captura y decisión guardadas del borrador parcial y conserva valores temporalmente vacíos', () => {
    const f = conRecepcion(),
      i = f.recepcion.renglones[0];
    f.recepcion.estado = 'BORRADOR';
    f.recepcion.fechaFinalizacion = null;
    i.borrador = {
      fisico: {
        ...i.fisico,
        cantidad: 7,
        cantidadAveria: null,
        erroresCriticos: null,
        codigoDeclarado: 'CODIGO-PARCIAL',
      },
      decision: 'PENDIENTE',
      justificacion: 'Justificación parcial',
      fecha: '2026-11-03T19:00:00Z',
      usuarioId: 10,
      usuarioNombre: 'Inspector parcial',
      diferencias: compararRecepcion(i.facturado, { ...i.fisico, cantidad: 7 }),
      muestreo: null,
    };
    const html = htmlInformeInvima(f);
    for (const s of [
      'INFORME EN CURSO',
      '1 borradores parciales sin confirmar',
      'Captura guardada',
      'Borrador parcial · Sin confirmar',
      'Decisión propuesta (sin confirmar)',
      'Rechazado · No cumple',
      'CODIGO-PARCIAL',
      'Justificación parcial',
      'Inspector parcial',
      'Muestreo: Sin calcular',
    ])
      expect(html).toContain(s);
    expect(html).toContain('No sustituye la captura confirmada');
  });
  it('respeta vitales, cero unidades, cantidad facturada ausente y controles heredados sin inferir cumplimiento', () => {
    const f = conRecepcion(),
      i = f.recepcion.renglones[0];
    i.fisico = {
      ...i.fisico,
      tipo: 'VITAL_NO_DISPONIBLE',
      ium: 'IUM-A001',
      numeroResolucion: 'RES-001',
      motivosRechazo: [],
    };
    f.productos[0].datos.tipo = 'VITAL_NO_DISPONIBLE';
    f.productos[0].candidato = null;
    let html = htmlInformeInvima(f);
    for (const s of ['IUM-A001', 'RES-001', 'Código IUM', 'Número de resolución', 'No aplica'])
      expect(html).toContain(s);
    i.fisico = { ...i.fisico, cantidad: 0, lotes: [] };
    i.decision = 'NO_RECIBIDO';
    i.facturado.cantidad = null;
    i.diferencias = compararRecepcion(i.facturado, i.fisico);
    i.muestreo = calcularMuestreo(0, 0);
    html = htmlInformeInvima(f);
    expect(html).toContain('Sin unidades para inspeccionar');
    expect(html).toContain('Muestreo: N/A · Muestra: 0');
    expect(html).toContain('No recibido');
    expect(html).not.toContain('rt-badge danger">No cumple');
    i.fisico = {
      ...i.fisico,
      cantidad: 1,
      tipo: 'MEDICAMENTO',
      registroSanitarioRevisado: undefined,
    };
    html = htmlInformeInvima(f);
    expect(html).toContain('rt-badge neutral">Sin dato');
  });
  it('escapa la captura física, lotes, motivos y justificación incluidos en el nuevo informe', () => {
    const f = conRecepcion(),
      i = f.recepcion.renglones[0];
    i.fisico.descripcion = '<script>físico</script>';
    i.fisico.lotes[0].lote = '<img src="https://evil">';
    i.justificacion = '<b>Justificación</b>';
    i.fisico.motivosRechazo = ['<script>'];
    const html = htmlInformeInvima(f);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=');
    expect(html).toContain('&lt;script&gt;físico&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;Justificación&lt;/b&gt;');
  });
});
