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
const nota = (n: Informe['observacion']) =>
  n.texto?.trim()
    ? `<div class="note"><strong>Observación:</strong> ${escape(n.texto)}</div>${n.fecha ? `<div class="audit">${escape(n.usuarioNombre)} · ${escape(fecha(n.fecha))}</div>` : ''}`
    : '';

export function htmlInformeInvima(f: Informe) {
  const pedido = f.tipoDocumento === 'PEDIDO';
  const counts: Record<string, number> = {};
  const sources = new Map<string, { id: number; nombre: string; dataset: string }>();
  for (const p of f.productos) {
    counts[p.resultado] = (counts[p.resultado] || 0) + 1;
    for (const source of p.verificacion?.fuentes || []) {
      const key = JSON.stringify([source.dataset, source.nombre]);
      if (!sources.has(key))
        sources.set(key, { id: sources.size + 1, nombre: source.nombre, dataset: source.dataset });
    }
  }
  const value = (label: string, text: unknown) =>
    `<div class="value"><span class="label">${escape(label)}</span> ${escape(text || 'Sin dato publicado')}</div>`;
  const productos = f.productos
    .map(p => {
      const c = p.candidato,
        v = p.verificacion,
        tipo = p.datos.tipo || 'MEDICAMENTO';
      const estadoCum =
        tipo === 'MEDICAMENTO'
          ? c?.estadoCum || (c ? 'Sin dato de estado' : resultados[p.resultado]) || 'Sin dato'
          : ['ALIMENTOS', 'DISPOSITIVO', 'MEDICO_QUIRURGICOS'].includes(tipo)
            ? 'No aplica'
            : 'No disponible en esta fuente';
      const detalles = c
        ? [
            c.nombre && c.nombre !== p.datos.descripcion ? ['Producto INVIMA', c.nombre] : null,
            c.presentacion ? ['Presentación', c.presentacion] : null,
            c.grupo ? ['Grupo', c.grupo] : null,
            c.fechaExpedicion ? ['Expedición publicada', c.fechaExpedicion] : null,
            c.fechaVencimiento ? ['Vencimiento publicado', c.fechaVencimiento] : null,
            c.fechaActivo ? ['Activo desde (fuente)', c.fechaActivo] : null,
            c.fechaInactivo ? ['Inactivo desde (fuente)', c.fechaInactivo] : null,
          ]
            .filter(Boolean)
            .map(d => `<span><strong>${escape(d[0])}:</strong> ${escape(d[1])}</span>`)
            .join(' · ')
        : '';
      const refs = (v?.fuentes || [])
        .map(source => {
          const id = sources.get(JSON.stringify([source.dataset, source.nombre]))!.id;
          return `${id}${source.error ? ' (consulta fallida)' : ''}`;
        })
        .join(', ');
      const audit = v
        ? `Verificado: ${escape(v.usuarioNombre)} · ${escape(fecha(v.fecha))}${v.confirmadoPor ? ` · Confirmado: ${escape(v.confirmadoPor)} · ${escape(fecha(v.confirmadoEn))}` : ''}${refs ? ` · Fuentes: ${escape(refs)}` : ''}`
        : '';
      const warnings = v?.advertencias?.length
        ? `<div class="warning">${v.advertencias.map(escape).join(' · ')}</div>`
        : '';
      // Long observations can flow across pages. Ordinary products stay together.
      const long = (p.observacion.texto?.length || 0) + detalles.length + audit.length > 1400;
      return `<tbody class="product${long ? ' product-long' : ''}"><tr class="product-main">
      <td><strong class="product-name">${p.orden}. ${escape(p.datos.descripcion)}</strong><div class="type">${escape(tipo.replace(/_/g, ' '))}</div>${c ? value('Titular INVIMA:', c.titular) : ''}</td>
      <td>${value('Declarado:', p.datos.codigoDeclarado || '(Vacío)')}${c?.cum ? value('Verificado:', c.cum) : ''}${value('Estado CUM:', estadoCum)}</td>
      <td>${value('Ingresado:', p.datos.registroSanitario || '(Vacío)')}${value('INVIMA:', c?.registroSanitario || (c ? 'Sin dato publicado' : 'Sin coincidencia asociada'))}${value('Estado registro:', c?.estadoRegistro || (c ? 'Sin dato publicado' : 'Sin coincidencia asociada'))}</td>
      <td><span class="result" data-result="${escape(p.resultado)}">${escape(resultados[p.resultado] || p.resultado)}</span></td>
      </tr>${detalles || audit || warnings || p.observacion.texto?.trim() ? `<tr class="product-detail"><td colspan="4">${detalles ? `<div class="published">${detalles}</div>` : ''}${audit ? `<div class="audit">${audit}</div>` : ''}${warnings}${nota(p.observacion)}</td></tr>` : ''}</tbody>`;
    })
    .join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{font:11px/1.35 Arial,sans-serif;color:#203448;margin:0}
    .hero{border-top:3px solid #0ba2b1;padding:10px 0 8px;border-bottom:1px solid #dbe5ec}
    .brand{font-size:9px;letter-spacing:1px;color:#087e8a;text-transform:uppercase}
    h1{font-size:20px;line-height:1.15;margin:4px 0 6px}h2{font-size:12px;margin:10px 0 5px}
    p{margin:4px 0}.meta{font-size:10px;color:#526779}.summary{font-size:10px;margin:7px 0}.summary span+span:before{content:' · ';color:#8293a2}
    .general{margin:7px 0 9px;padding:7px 9px;background:#f4f7fa;border-left:2px solid #12a3b2}.general>strong{font-size:11px}.general .note{margin-top:3px}
    table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th{font-size:10px;padding:6px;text-align:left;background:#eaf5f6;color:#18505a;border-bottom:1px solid #c8dde0}
    th:nth-child(1){width:34%}th:nth-child(2){width:18%}th:nth-child(3){width:29%}th:nth-child(4){width:19%}
    td{padding:6px;vertical-align:top;overflow-wrap:anywhere}tbody.product{break-inside:avoid;border-bottom:1px solid #dbe5ec}tbody.product-long{break-inside:auto}
    .product-main{break-inside:avoid}.product-detail td{padding:0 6px 6px}.product-name{font-size:11px;font-weight:600}.type{font-size:9px;color:#607386;margin:2px 0 3px}
    .value{margin:0 0 3px}.label{font-size:9px;color:#607386}.result{font-size:10px;font-weight:600;display:inline-block;padding:3px 5px;border-radius:3px;background:#edf3f6;color:#304c60}
    .result[data-result="EXACTA"],.result[data-result="CONFIRMADA"]{background:#e7f5ef;color:#176844}.result[data-result="REVISION"],.result[data-result="INCOMPLETA"]{background:#fff4de;color:#795514}
    .published{font-size:10px;color:#40586c;margin-bottom:3px}.audit{font-size:9px;color:#607386;margin:2px 0;overflow-wrap:anywhere}
    .note{white-space:pre-wrap;overflow-wrap:anywhere;margin:4px 0 2px}.warning{font-size:10px;color:#795514;background:#fff7e6;padding:4px 6px;margin:3px 0}
    .sources{font-size:9px;overflow-wrap:anywhere;columns:2;column-gap:18px}.sources div{break-inside:avoid;margin:2px 0}
    .footnote{font-size:9px;color:#607386;margin-top:8px;padding-top:6px;border-top:1px solid #dbe5ec;orphans:3;widows:3}
    </style></head><body>
    <header class="hero"><div class="brand">Eklipse · Inventario</div><h1>Informe de verificación INVIMA</h1>
      <p>${pedido ? 'Pedido' : 'Factura'} <strong>${escape(f.numero)}</strong> · ${pedido ? 'Cliente: ' + escape(f.cliente) : escape(f.proveedor)}</p>
      <p class="meta">${pedido && f.proveedor ? `Proveedor: ${escape(f.proveedor)} · ` : ''}${!pedido && f.nitProveedor ? `NIT: ${escape(f.nitProveedor)} · ` : ''}${pedido ? 'Fecha de pedido' : 'Fecha de factura'}: ${escape(f.fecha || 'Sin fecha')} · ${f.productos.length} productos · Generado: ${escape(fecha(f.generadoEn))} (Colombia)</p>
    </header>
    <div class="summary">${Object.entries(counts)
      .map(([r, n]) => `<span>${escape(resultados[r] || r)}: <strong>${n}</strong></span>`)
      .join('')}</div>
    <section class="general"><strong>Observación general</strong>${f.observacion.texto?.trim() ? nota(f.observacion) : '<span> · Sin observaciones.</span>'}</section>
    <table aria-label="Resultados por producto"><thead><tr><th>Producto / titular INVIMA</th><th>CUM / código</th><th>Registro sanitario</th><th>Comparación</th></tr></thead>${productos}</table>
    ${sources.size ? `<h2>Fuentes consultadas</h2><div class="sources">${[...sources.values()].map(s => `<div><strong>${s.id}.</strong> ${escape(s.nombre)} (${escape(s.dataset)})</div>`).join('')}</div>` : ''}
    <p class="footnote">Resultados guardados y observaciones del equipo. “Sin coincidencias” no significa que el producto carezca de registro sanitario. Los estados del CUM y del registro son independientes; las fechas publicadas no determinan por sí solas su vigencia. Sin nuevas consultas a INVIMA para generar este informe.</p>
    </body></html>`;
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
            margin: { top: '11mm', bottom: '15mm', left: '12mm', right: '12mm' },
            displayHeaderFooter: true,
            headerTemplate: '<span></span>',
            footerTemplate:
              '<div style="font:9px Arial;color:#607386;width:100%;padding:0 12mm;display:flex;justify-content:space-between"><span>Eklipse · Verificación INVIMA</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>',
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
