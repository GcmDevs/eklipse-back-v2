import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { FacturasInvimaService } from '../application/facturas.service';

type Informe = Awaited<ReturnType<FacturasInvimaService['informe']>>;
const escape = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
const fecha = (value: string | Date) =>
  value
    ? new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Sin fecha';
const resultados: Record<string, string> = {
  PENDIENTE: 'Sin verificar',
  EXACTA: 'Coincidencia exacta',
  CONFIRMADA: 'Coincidencia confirmada',
  REVISION: 'Requiere revisión',
  SIN_COINCIDENCIAS: 'Sin coincidencias',
  INCOMPLETA: 'Consulta incompleta / fallida',
};
const dato = (label: string, value: unknown) =>
  `<div><dt>${escape(label)}</dt><dd>${escape(value || 'Sin dato')}</dd></div>`;
const nota = (n: Informe['observacion']) =>
  `<div class="nota">${escape(n.texto || 'Sin observaciones.')}</div>${n.fecha ? `<p class="audit">${escape(n.usuarioNombre)} · ${escape(fecha(n.fecha))}</p>` : ''}`;

export function htmlInformeInvima(f: Informe) {
  const counts = f.productos.reduce(
    (a, p) => {
      a[p.resultado] = (a[p.resultado] || 0) + 1;
      return a;
    },
    {} as Record<string, number>
  );
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{font:11px/1.5 Arial,sans-serif;color:#203448;margin:0}h1{font-size:27px;line-height:1.2;margin:8px 0}h2{font-size:15px;margin:0 0 9px}h3{font-size:13px;margin:0;overflow-wrap:anywhere}.eyebrow{color:#078a98;letter-spacing:1.4px;font-size:9px;font-weight:bold;text-transform:uppercase}.hero{border-top:5px solid #0ba2b1;padding:20px 0 16px;border-bottom:1px solid #dbe5ec}.muted,.audit{color:#607386}.audit{font-size:9px;margin:6px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px}dl{margin:12px 0}dt{font-size:9px;color:#607386}dd{margin:2px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.summary{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.badge{display:inline-block;padding:5px 9px;background:#edf7f8;color:#096e78;border-radius:4px;font-size:10px}.section{margin:20px 0}.nota{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f7fa;border-left:3px solid #12a3b2;padding:12px;orphans:3;widows:3}.product{margin:0 0 20px;padding-top:14px;border-top:1px solid #dbe5ec}.product-head{break-inside:avoid;break-after:avoid;display:flex;justify-content:space-between;gap:15px;align-items:start}.product-head h3{flex:1}.product-head .badge{max-width:180px}.label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#607386;margin:12px 0 5px;break-after:avoid}.warning{background:#fff7e6;padding:8px 10px;color:#77571d}.footnote{font-size:9px;color:#607386;border-top:1px solid #dbe5ec;padding-top:12px}p{orphans:3;widows:3}a{color:#077d8b}dl>div{break-inside:avoid}.nota:empty{display:none}
    </style></head><body><header class="hero"><div class="eyebrow">Eklipse · Inventario</div><h1>Informe de verificación INVIMA</h1><p>Factura <strong>${escape(f.numero)}</strong> · ${escape(f.proveedor)}</p><dl class="grid">${dato('NIT del proveedor', f.nitProveedor)}${dato('Fecha de factura', f.fecha)}${dato('Generado en horario de Colombia', fecha(f.generadoEn))}${dato('Productos incluidos', f.productos.length)}</dl></header>
    <div class="summary">${Object.entries(counts)
      .map(([r, n]) => `<span class="badge">${escape(resultados[r] || r)}: ${n}</span>`)
      .join('')}</div>
    <section class="section"><h2>Observación general</h2>${nota(f.observacion)}</section>
    <p class="footnote">Este informe reproduce los resultados guardados y las observaciones del equipo. “Sin coincidencias” no significa que el producto carezca de registro sanitario. Los estados del CUM y del registro se muestran por separado; las fechas publicadas no determinan por sí solas su vigencia. No se realizaron nuevas consultas a INVIMA para generar este PDF.</p><section class="section"><h2>Resultados por producto</h2>${f.productos
      .map(p => {
        const c = p.candidato,
          v = p.verificacion,
          tipo = p.datos.tipo || 'MEDICAMENTO';
        const cum =
          tipo === 'MEDICAMENTO'
            ? c?.estadoCum || (c ? 'Sin dato de estado' : resultados[p.resultado]) || 'Sin dato'
            : ['ALIMENTOS', 'DISPOSITIVO', 'MEDICO_QUIRURGICOS'].includes(tipo)
              ? 'No aplica'
              : 'No disponible en esta fuente';
        return `<article class="product"><div class="product-head"><h3>${p.orden}. ${escape(p.datos.descripcion)}</h3><span class="badge">${escape(resultados[p.resultado] || p.resultado)}</span></div><dl class="grid">${dato('Tipo', tipo.replace(/_/g, ' '))}${dato('CUM / código declarado', p.datos.codigoDeclarado)}${dato('Registro ingresado', p.datos.registroSanitario)}${dato('Estado CUM', cum)}${dato('CUM verificado', c?.cum)}${dato('Estado del registro', c?.estadoRegistro || (c ? 'Sin dato publicado' : 'Sin coincidencia asociada'))}</dl>
      ${c ? `<p class="label">Coincidencia asociada</p><dl class="grid">${dato('Producto encontrado', c.nombre)}${dato('Titular', c.titular)}${dato('Registro encontrado', c.registroSanitario)}${dato('Presentación', c.presentacion)}${c.grupo ? dato('Grupo', c.grupo) : ''}${c.fechaExpedicion ? dato('Fecha de expedición publicada', c.fechaExpedicion) : ''}${c.fechaVencimiento ? dato('Fecha de vencimiento publicada', c.fechaVencimiento) : ''}${c.fechaActivo ? dato('Fecha activo publicada', c.fechaActivo) : ''}${c.fechaInactivo ? dato('Fecha inactivo publicada', c.fechaInactivo) : ''}</dl>` : ''}
      ${v ? `<p class="audit">Verificado por ${escape(v.usuarioNombre)} · ${escape(fecha(v.fecha))}${v.confirmadoPor ? `<br>Confirmado por ${escape(v.confirmadoPor)} · ${escape(fecha(v.confirmadoEn))}` : ''}</p><p class="audit">Fuentes: ${escape(v.fuentes?.map(s => `${s.nombre} (${s.dataset})${s.error ? ': consulta fallida' : ''}`).join('; '))}</p>${v.advertencias?.length ? `<p class="warning">${v.advertencias.map(escape).join('<br>')}</p>` : ''}` : '<p class="audit">Este producto aún no tiene una verificación vigente guardada.</p>'}
      <p class="label">Observación del producto</p>${nota(p.observacion)}</article>`;
      })
      .join('')}</section></body></html>`;
}

@Injectable()
export class InformeInvimaPdfService {
  private readonly logger = new Logger(InformeInvimaPdfService.name);
  private activos = 0;
  async generar(informe: Informe): Promise<Buffer> {
    if (this.activos >= 2)
      throw new ServiceUnavailableException(
        'Hay dos informes en preparación. Intente de nuevo en unos segundos.'
      );
    this.activos++;
    let browser: puppeteer.Browser;
    let timer: ReturnType<typeof setTimeout>;
    try {
      browser = await puppeteer.launch({
        headless: true,
        timeout: 15000,
        ...(process.env.INVIMA_PDF_BROWSER_PATH
          ? { executablePath: process.env.INVIMA_PDF_BROWSER_PATH }
          : {}),
      });
      const render = async () => {
        const page = await browser.newPage();
        // Report data is escaped text; no remote resources or scripts are allowed.
        await page.setJavaScriptEnabled(false);
        await page.setRequestInterception(true);
        page.on('request', r => void r.abort());
        await page.setContent(htmlInformeInvima(informe), {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });
        return Buffer.from(
          await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '20mm', left: '17mm', right: '17mm' },
            displayHeaderFooter: true,
            headerTemplate: '<span></span>',
            footerTemplate:
              '<div style="font:9px Arial;color:#607386;width:100%;padding:0 17mm;display:flex;justify-content:space-between"><span>Eklipse · Verificación INVIMA</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>',
            timeout: 20000,
          })
        );
      };
      return await Promise.race([
        render(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            browser.process()?.kill();
            reject(new Error('Tiempo de generación agotado'));
          }, 30000);
        }),
      ]);
    } catch (error) {
      this.logger.error('Falló la generación del informe INVIMA.', error?.message);
      throw new ServiceUnavailableException(
        'No se pudo generar el PDF. Las observaciones guardadas se conservan. Intente de nuevo o revise el navegador configurado en el servidor.'
      );
    } finally {
      clearTimeout(timer);
      if (browser) await browser.close().catch(() => browser.process()?.kill());
      this.activos--;
    }
  }
}
