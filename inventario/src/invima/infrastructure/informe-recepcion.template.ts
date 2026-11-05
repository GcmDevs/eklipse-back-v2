import type { FacturasInvimaService } from '../application/facturas.service';
import { requiereConcentracion } from '../domain/recepcion.models';
import { lotesDocumentoDe } from '../domain/lotes-documento';

type Informe = Awaited<ReturnType<FacturasInvimaService['informe']>>;
type Producto = Informe['productos'][number];
type Renglon = NonNullable<Informe['recepcion']>['renglones'][number];
type Captura =
  | Pick<Renglon, 'fisico' | 'decision' | 'justificacion' | 'diferencias' | 'muestreo'>
  | NonNullable<Renglon['borrador']>;
const esc = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
const texto = (s: unknown, vacio = 'Sin dato') =>
  esc(s === null || s === undefined || s === '' ? vacio : s);
const tipo = (s: string) => (s || 'SIN_CLASIFICAR').replace(/_/g, ' ');
const fecha = (s: string | Date | null | undefined) =>
  s && Number.isFinite(new Date(s).getTime())
    ? new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(s))
    : 'Sin fecha';
const decisiones = {
  PENDIENTE: 'Pendiente',
  ACEPTADO: 'Aceptado',
  RECHAZADO: 'Rechazado · No cumple',
  NO_RECIBIDO: 'No recibido',
};
const resultados: Record<string, string> = {
  PENDIENTE: 'Sin verificar',
  EXACTA: 'Coincidencia exacta',
  CONFIRMADA: 'Coincidencia confirmada',
  REVISION: 'Requiere revisión',
  SIN_COINCIDENCIAS: 'Sin coincidencias',
  INCOMPLETA: 'Consulta incompleta / fallida',
};
const badge = (s: unknown, color = 'neutral') =>
  `<span class="rt-badge ${color}">${texto(s)}</span>`;
const colorDecision = (s: string) =>
  s === 'ACEPTADO'
    ? 'success'
    : s === 'RECHAZADO'
      ? 'danger'
      : s === 'PENDIENTE'
        ? 'warn'
        : 'neutral';
function estado(s: string | null | undefined) {
  const n = (s || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  const color = ['ACTIVO', 'ACTIVA', 'VIGENTE'].includes(n)
    ? 'success'
    : [
          'INACTIVO',
          'INACTIVA',
          'VENCIDO',
          'VENCIDA',
          'CANCELADO',
          'CANCELADA',
          'SUSPENDIDO',
          'SUSPENDIDA',
          'ANULADO',
          'ANULADA',
          'NEGADO',
          'NEGADA',
        ].includes(n)
      ? 'danger'
      : [
            'RENOVACION',
            'EN RENOVACION',
            'EN TRAMITE',
            'EN TRAMITE DE RENOVACION',
            'EN TRAMITE RENOV',
          ].includes(n)
        ? 'warn'
        : 'neutral';
  return badge(s || 'Sin dato publicado', color);
}
const campo = (label: string, value: unknown, vacio?: string) =>
  `<div><span class="rt-label">${esc(label)}</span><strong>${texto(value, vacio)}</strong></div>`;
const diferencia = (s: string) =>
  badge(
    {
      COINCIDE: 'Coincide',
      DIFIERE: 'Difiere',
      SIN_DATO: 'Sin dato para comparar',
      NO_APLICA: 'No aplica',
    }[s] || s,
    s === 'DIFIERE' ? 'danger' : s === 'COINCIDE' ? 'success' : 'neutral'
  );
const loteComparado = (s: string, declarados?: string[]) => {
  if (!s?.trim()) return 'Ingrese un lote';
  const lista = (declarados || []).filter(l => l?.trim());
  if (!lista.length) return 'Sin lote en factura';
  return lista.some(l => l.trim().toUpperCase() === s.trim().toUpperCase())
    ? 'Coincide con la factura'
    : 'No coincide con la factura';
};
function estadoCum(p: Producto) {
  if (p.datos.tipo === 'VITAL_NO_DISPONIBLE') return 'No aplica';
  if (!p.datos.tipo || p.datos.tipo === 'MEDICAMENTO')
    return p.candidato?.estadoCum || (p.candidato ? 'Sin dato de estado' : resultados[p.resultado]);
  return ['ALIMENTOS', 'DISPOSITIVO', 'MEDICO_QUIRURGICOS'].includes(p.datos.tipo)
    ? 'No aplica'
    : 'No disponible en esta fuente';
}

export function resumenRecepcion(f: Informe) {
  const r = f.recepcion;
  if (!r)
    return '<div class="rt-notice">Recepción técnica no iniciada. Este informe contiene la verificación de los datos facturados y sus observaciones.</div>';
  const counts = new Map<string, number>();
  r.renglones.forEach(i => counts.set(i.decision, (counts.get(i.decision) || 0) + 1));
  const drafts = r.renglones.filter(i => i.borrador).length;
  return `<section class="rt-summary"><h2>Recepción técnica ${badge(r.estado === 'FINALIZADA' ? 'Finalizada' : 'En curso', r.estado === 'FINALIZADA' ? 'success' : 'warn')}</h2>
    <p>${[...counts].map(([s, n]) => `${esc(decisiones[s] || s)}: <strong>${n}</strong>`).join(' · ')}${drafts ? ` · <strong>${drafts} borradores parciales sin confirmar</strong>` : ''}</p>
    <p class="audit">Recepción #${r.id} · Versión ${r.version} · Creada: ${esc(fecha(r.fechaCreacion))} · Usuario ID ${r.creadoPor}<br>Actualizada: ${esc(fecha(r.fechaActualizacion))} · Usuario ID ${r.actualizadoPor}${r.fechaFinalizacion ? ` · Finalizada: ${esc(fecha(r.fechaFinalizacion))}` : ''} (Colombia)</p>
    ${r.estado !== 'FINALIZADA' ? '<p class="rt-notice">INFORME EN CURSO. Las decisiones confirmadas y los borradores parciales se muestran por separado. No representa una recepción finalizada.</p>' : ''}</section>`;
}

function capturaHtml(p: Producto, item: Renglon, captura: Captura, borrador = false) {
  const f = captura.fisico,
    a = item.facturado,
    d = captura.diferencias;
  const c = p.candidato,
    cero = f.cantidad === 0,
    vital = f.tipo === 'VITAL_NO_DISPONIBLE';
  const normalCum = (s: string) =>
    s
      ?.trim()
      .match(/^(\d{1,12})\s*-\s*(\d{1,8})$/)
      ?.slice(1)
      .map(n => n.replace(/^0+(?=\d)/, ''))
      .join('-');
  const compararOficial = (a: string, b: string, normalizar: (s: string) => string) =>
    a?.trim() && b?.trim() && normalizar(a) && normalizar(b)
      ? normalizar(a) === normalizar(b)
        ? 'COINCIDE'
        : 'DIFIERE'
      : '';
  const normalRegistro = (s: string) =>
    s
      .replace(/\bINVIMA\b/gi, '')
      .replace(/\s+/g, '')
      .toUpperCase();
  const fila = (
    label: string,
    facturado: unknown,
    fisico: unknown,
    invima: unknown,
    comparacion?: string,
    oficial?: string
  ) =>
    `<tr><th>${esc(label)}</th><td>${texto(facturado, '(Vacío)')}</td><td>${texto(fisico, '(Vacío)')}${comparacion ? `<div>${diferencia(comparacion)}</div>` : ''}</td><td>${texto(invima, p.datos.tipo === 'VITAL_NO_DISPONIBLE' ? 'No aplica' : c ? 'Sin dato publicado' : 'Sin coincidencia asociada')}${oficial ? `<div>${diferencia(oficial)}</div>` : ''}</td></tr>`;
  const cantidad =
    a.cantidad == null ? 'Sin dato' : `${a.cantidad}${a.unidadMedida ? ' ' + a.unidadMedida : ''}`;
  const lotes = f.lotes || [];
  const total = lotes.every(l => l.cantidad !== null && Number.isFinite(l.cantidad))
    ? Math.round(lotes.reduce((n, l) => n + l.cantidad!, 0) * 10000) / 10000
    : null;
  const check = (s: string, value: boolean | undefined, noAplica = false) =>
    `<div><span>${esc(s)}</span>${badge(noAplica ? 'No aplica' : value === undefined ? 'Sin dato' : value ? 'Sí' : 'No marcado', noAplica || value === undefined ? 'neutral' : value ? 'success' : 'warn')}</div>`;
  const muestreo = captura.muestreo;
  return `<div class="rt-capture${borrador ? ' rt-draft' : ''}">
    <h3>${borrador ? 'Borrador parcial · Sin confirmar' : 'Captura guardada'}</h3>
    <table class="rt-comparison"><colgroup><col style="width:17%"><col style="width:27%"><col style="width:28%"><col style="width:28%"></colgroup><thead><tr><th>Dato</th><th>Factura validada</th><th>Recibido físicamente</th><th>INVIMA · Factura</th></tr></thead><tbody>
      ${fila('Tipo', tipo(a.tipo), tipo(f.tipo), c?.grupo || '', d.tipo)}
      ${fila('Descripción', a.descripcion, f.descripcion, c?.nombre)}
      ${fila('Cantidad', cantidad, f.cantidad ?? 'Sin dato', 'No aplica')}
      ${fila('CUM / código', a.codigoDeclarado, vital ? 'No aplica' : f.codigoDeclarado, p.datos.tipo === 'VITAL_NO_DISPONIBLE' ? 'No aplica' : c?.cum || (p.datos.tipo !== 'MEDICAMENTO' ? 'No disponible en esta fuente' : ''), d.cum, p.datos.tipo === 'MEDICAMENTO' && c ? compararOficial(a.codigoDeclarado, c.cum, normalCum) : '')}
      ${fila('Registro sanitario', a.registroSanitario, vital ? 'No aplica' : f.registroSanitario, p.datos.tipo === 'VITAL_NO_DISPONIBLE' ? 'No aplica' : c?.registroSanitario, d.registro, c ? compararOficial(a.registroSanitario, c.registroSanitario, normalRegistro) : '')}
      ${a.cantidadPresentacion != null ? fila('Presentaciones del documento', a.cantidadPresentacion, 'Sin dato', 'No aplica') : ''}
      ${fila('Presentación', p.datosProducto?.presentacion, f.presentacion, c?.presentacion)}
      ${fila('Laboratorio / titular', p.datosProducto?.laboratorio, f.laboratorio, c?.titular)}
      ${fila('Forma farmacéutica', p.datosProducto?.formaFarmaceutica, f.formaFarmaceutica, c?.formaFarmaceutica)}
    </tbody></table>
    <div class="rt-metrics">${campo('Faltante', d.faltante)}${campo('Sobrante', d.sobrante)}${campo('Avería · unidades dañadas', f.cantidadAveria)}${campo('No solicitado', f.cantidadNoSolicitada)}${campo('Estado del empaque', cero ? 'No aplica' : { BUENO: 'Bueno', ACEPTABLE: 'Aceptable', DETERIORADO: 'Deteriorado' }[f.estadoEmpaque] || 'Sin dato')}</div>
    ${
      cero
        ? '<p class="rt-notice">Sin unidades para inspeccionar. Lotes, conservación, verificaciones físicas y muestreo: No aplica.</p>'
        : `<h4>Identificación y conservación</h4><div class="rt-fields">
      ${campo('Clasificación de riesgo', f.riesgo)}${campo('Marca', f.marca)}${campo('Concentración', requiereConcentracion(f.tipo) ? f.concentracion : 'No aplica')}${campo('Unidad de medida', requiereConcentracion(f.tipo) ? f.unidadConcentracion : 'No aplica')}${campo('Temperatura', f.temperatura == null ? null : `${f.temperatura} ${f.unidadTemperatura === 'K' ? 'K' : '°' + f.unidadTemperatura}`)}
      ${vital ? campo('Código IUM', f.ium) + campo('Número de resolución', f.numeroResolucion) : ''}
    </div>`
    }
    <h4>Lotes recibidos</h4><p class="audit">Lotes y vencimientos declarados en la factura: ${texto(
      lotesDocumentoDe(a)
        .map(l => `${l.lote} · Vence: ${l.vencimiento || 'Sin fecha'}`)
        .join('; '),
      'Sin lote en factura'
    )} · Suma de lotes físicos: ${texto(total)}${f.cantidad == null ? '' : total === f.cantidad ? ' · Coincide con la cantidad física' : ' · Difiere de la cantidad física'}</p>
    ${
      lotes.length
        ? `<table class="rt-lots"><thead><tr><th>Cantidad</th><th>Lote físico</th><th>Vencimiento</th><th>Comparación con factura</th></tr></thead><tbody>${lotes
            .map(l => {
              const comp = loteComparado(l.lote, a.lotesDeclarados);
              return `<tr><td>${texto(l.cantidad)}</td><td>${texto(l.lote)}</td><td>${texto(l.vencimiento)}</td><td>${badge(comp, comp === 'Coincide con la factura' ? 'success' : comp === 'No coincide con la factura' ? 'danger' : 'neutral')}</td></tr>`;
            })
            .join('')}</tbody></table>`
        : `<p>${cero ? 'No aplica · No recibido.' : 'Sin lotes registrados.'}</p>`
    }
    <h4>Verificación física y muestreo</h4><div class="rt-check-grid">
      ${check('Registro sanitario verificado en la base de datos INVIMA', f.registroSanitarioRevisado, cero || vital)}
      ${check('Etiquetas del producto revisadas', f.etiquetaConforme, cero)}
      ${check('Ortografía y sellos de seguridad revisados', f.sellosConformes, cero)}
      ${check('Fabricante corresponde al expediente sanitario', f.fabricanteConforme, cero || vital)}
    </div><p>${cero ? 'Muestreo: N/A · Muestra: 0 · Sin unidades para inspeccionar' : muestreo ? `Muestreo: ${esc(muestreo.nivel)} · Muestra: ${muestreo.muestra} · Errores críticos: ${texto(f.erroresCriticos)} · ${badge(muestreo.cumple ? 'Cumple' : 'No cumple', muestreo.cumple ? 'success' : 'danger')}` : `Muestreo: Sin calcular · Errores críticos: ${texto(f.erroresCriticos)}`}</p>
    <div class="rt-decision${captura.justificacion.length > 1000 ? ' rt-decision-long' : ''}"><strong>${borrador ? 'Decisión propuesta (sin confirmar)' : 'Decisión de recepción'}:</strong> ${badge(decisiones[captura.decision] || captura.decision, colorDecision(captura.decision))}<p>Motivos de rechazo: ${texto(vital ? 'No aplica' : f.motivosRechazo?.map(m => 'Por ' + m).join(', '), 'Ninguno registrado')}</p><div class="note"><strong>Justificación del inspector:</strong> ${texto(captura.justificacion, 'Sin justificación registrada')}</div></div>
  </div>`;
}

export function detalleRecepcion(
  f: Informe,
  fuenteId: (dataset: string, nombre: string) => number | undefined
) {
  if (!f.recepcion) return '';
  return f.productos
    .map(p => {
      const i = f.recepcion!.renglones.find(i => i.facturaItemId === p.renglonId);
      const c = p.candidato,
        v = p.verificacion;
      const fechas = c
        ? [
            ['Expedición publicada', c.fechaExpedicion],
            ['Vencimiento publicado', c.fechaVencimiento],
            ['Activo desde (fuente)', c.fechaActivo],
            ['Inactivo desde (fuente)', c.fechaInactivo],
          ]
            .filter(([, s]) => s)
            .map(([n, s]) => `${esc(n)}: ${esc(s)}`)
            .join(' · ')
        : '';
      const refs = (v?.fuentes || [])
        .map(
          s =>
            `${fuenteId(s.dataset, s.nombre) || ''}${s.error ? ' (consulta fallida: ' + s.error + ')' : ''}`
        )
        .join(', ');
      return `<section class="rt-product"><header class="rt-product-head"><h2>${p.orden}. ${esc(p.datos.descripcion)}</h2><span>${esc(tipo(p.datos.tipo || 'MEDICAMENTO'))} · ${badge(i ? decisiones[i.decision] : 'Sin captura', i ? colorDecision(i.decision) : 'neutral')}${i?.borrador ? ' · ' + badge('Borrador parcial', 'warn') : ''}</span></header>
      <div class="rt-official"><h3>Verificación oficial de los datos facturados</h3><p>${badge(p.datos.tipo === 'VITAL_NO_DISPONIBLE' ? 'No aplica · Comprobación documental' : resultados[p.resultado] || p.resultado, p.datos.tipo === 'VITAL_NO_DISPONIBLE' ? 'neutral' : ['EXACTA', 'CONFIRMADA'].includes(p.resultado) ? 'success' : 'warn')} · Estado CUM: ${estado(estadoCum(p))} · Estado del registro: ${estado(p.datos.tipo === 'VITAL_NO_DISPONIBLE' ? 'No aplica' : c?.estadoRegistro || (c ? 'Sin dato publicado' : 'Sin coincidencia asociada'))}</p>
      ${fechas ? `<p class="audit">${fechas}</p>` : ''}${v ? `<p class="audit">Consulta: ${esc(v.usuarioNombre)} · ${esc(fecha(v.fecha))} (Colombia)${v.confirmadoPor ? ` · Confirmada: ${esc(v.confirmadoPor)} · ${esc(fecha(v.confirmadoEn))} (Colombia)` : ''}${refs ? ` · Fuentes: ${esc(refs)}` : ''}</p>` : ''}${v?.advertencias?.length ? `<div class="warning">${v.advertencias.map(esc).join(' · ')}</div>` : ''}
      </div>
      ${i ? `${capturaHtml(p, i, i)}<p class="audit">Registro del renglón #${i.id} · Versión ${i.version} · Última actualización: ${esc(fecha(i.fecha))} (Colombia) · Usuario ID ${i.usuarioId}</p>${i.borrador ? `${capturaHtml(p, i, i.borrador, true)}<p class="audit">Borrador parcial: ${esc(i.borrador.usuarioNombre || 'Usuario ID ' + i.borrador.usuarioId)} · ${esc(fecha(i.borrador.fecha))} (Colombia). No sustituye la captura confirmada ni la decisión guardada.</p>` : ''}` : '<p class="rt-notice">Este producto no tiene un renglón de recepción guardado.</p>'}
      ${p.observacion.texto?.trim() ? `<div class="rt-observation note${p.observacion.texto.length > 1000 ? ' rt-observation-long' : ''}"><strong>Observación del producto:</strong> ${esc(p.observacion.texto)}${p.observacion.fecha ? `<div class="audit">${esc(p.observacion.usuarioNombre)} · ${esc(fecha(p.observacion.fecha))} (Colombia)</div>` : ''}</div>` : ''}
    </section>`;
    })
    .join('');
}

export const estilosRecepcion = `
  .rt-summary{margin:8px 0;padding:7px 9px;background:#f0f7f8;border:1px solid #d3e5e8}.rt-summary h2{margin:0 0 4px}
  .rt-notice{padding:5px 7px;background:#fff6e4;color:#745519;margin:6px 0;font-size:10px}
  .rt-product{margin:12px 0 15px;border-top:2px solid #109eac;break-inside:auto}.rt-product-head{padding:5px 0;break-inside:avoid;break-after:avoid}.rt-product-head h2{font-size:12px;margin:0 0 3px}
  .rt-product p{margin:3px 0}.rt-product h3{font-size:10px;margin:5px 0;break-after:avoid}.rt-product h4{font-size:10px;margin:6px 0 3px;break-after:avoid}.rt-official{background:#f3f8fa;padding:5px 7px;break-inside:avoid;break-after:avoid}
  .rt-badge{display:inline-block;padding:1px 4px;border-radius:3px;background:#edf1f5;color:#52637a;font-size:9px;font-weight:600;vertical-align:baseline}.rt-badge:before{content:'• ';font-weight:bold}.rt-badge.success{background:#dcfce7;color:#166534}.rt-badge.danger{background:#fee2e2;color:#991b1b}.rt-badge.warn{background:#fef3c7;color:#92400e}
  .rt-capture{margin-top:6px}.rt-draft{border-left:2px solid #dfb34c;padding:1px 0 3px 7px}.rt-draft>h3{color:#795514}
  .rt-comparison th,.rt-comparison td,.rt-lots th,.rt-lots td{font-size:9px;padding:4px;border-bottom:1px solid #dde6ed;break-inside:avoid}.rt-comparison th:nth-child(n),.rt-lots th:nth-child(n){width:auto}.rt-comparison tbody th{background:#f5f8fa;color:#526779;font-weight:normal}.rt-comparison tr,.rt-lots tr{break-inside:avoid}
  .rt-fields,.rt-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 12px;padding:5px 0;break-inside:avoid}.rt-metrics{grid-template-columns:repeat(5,minmax(0,1fr));background:#f7f9fb;padding:5px}.rt-label{display:block;font-size:9px;color:#607386}.rt-fields strong,.rt-metrics strong{display:block;font-size:10px;font-weight:normal;overflow-wrap:anywhere}
  .rt-check-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;font-size:9px;break-inside:avoid}.rt-check-grid>div{display:flex;justify-content:space-between;gap:5px;border-bottom:1px solid #e7edf2;padding:3px 0}.rt-check-grid .rt-badge{white-space:nowrap;align-self:start}
  .rt-decision{padding:5px 7px;background:#f4f7fa;margin-top:5px;orphans:3;widows:3;break-inside:avoid}.rt-observation{border-left:2px solid #b8ceda;padding:4px 7px;orphans:3;widows:3;break-inside:avoid}.rt-decision-long,.rt-observation-long{break-inside:auto}
`;
