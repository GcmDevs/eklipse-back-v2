import jsPDF from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
import { MEDICALIZADO, MEDICALIZADO_NEONATAL, TIPOS_TRASLADO } from '@hpn/lgc/tas/types/gcn';
import { TrasladoAsistencialDetalleDataRes } from '../../application/responses';
import { findImageFromContext } from '@common/application/services';
import { gcmContextFactory, GcmContexts } from '@common/domain/types';
import { TIPOS_EMPLEADO } from '@hpn/lgc/tas/types/gcn';
import {
  codigoCupsFactory,
  TIPO_REMISIONES_VALUES,
  VIVO,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';

export interface TrasladoPdfPayload {
  clinica: {
    contexto: GcmContexts;
    nombre: string;
  };
  data: TrasladoAsistencialDetalleDataRes;
}

// ─── Estilos y Colores Estándar ──────────────────────────────────────────────
const F = { b: 'bold', n: 'normal', i: 'italic' } as const;
const FM = { h: 'helvetica', c: 'courier' } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const v = (val: any, fb = ''): string =>
  val !== undefined && val !== null && val !== '' ? String(val) : fb;

const fmt = (date: Date | string | undefined): string =>
  date
    ? new Date(date).toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const getUsuarioLabel = (nombre?: string, documento?: string): string => {
  const n = v(nombre);
  const d = v(documento);
  return n && d ? `${n} / CC: ${d}` : n || d;
};

/** Resuelve la ruta absoluta de un recurso en el backend monorepo independientemente del cwd actual */
function resolveBackendResource(relativePath: string): string {
  if (path.isAbsolute(relativePath)) return relativePath;
  const cleanPath = relativePath.replace(/^(\.\.[\/\\])+/, '');
  const isSubdir = /[\\\/]\d+$/.test(process.cwd());
  const backendRoot = isSubdir ? path.resolve(process.cwd(), '..') : process.cwd();
  return path.resolve(backendRoot, cleanPath);
}

/** Carga una imagen local para jsPDF usando fs.readFileSync directamente */
function getLocalImageBuffer(
  relativePath: string,
  folder = 'firma'
): { buffer: any; ext: string } | null {
  if (!relativePath) return null;
  try {
    const fileName = relativePath.split('/').pop();
    if (!fileName) return null;
    const resourcePath = `public/gen/trasl/${folder}/${fileName}`;
    const resolvedPath = resolveBackendResource(resourcePath);
    if (fs.existsSync(resolvedPath)) {
      const buffer = fs.readFileSync(resolvedPath);
      const ext = fileName.endsWith('.png') ? 'png' : 'jpeg';
      return { buffer, ext };
    }
  } catch (e) {}
  return null;
}

/** Obtiene el buffer de una firma a partir de la cédula del usuario buscando en private/gen/trasl */
function getFirmaBufferFromCedula(cedula?: string): { buffer: any; ext: string } | null {
  if (!cedula) return null;
  try {
    const targetCedula = String(cedula).trim();
    const folderPath = resolveBackendResource('private/gen/trasl');
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      const matchedFile = files.find(f => f.includes(targetCedula));
      if (matchedFile) {
        const resolvedPath = path.resolve(folderPath, matchedFile);
        const buffer = fs.readFileSync(resolvedPath);
        return { buffer, ext: matchedFile.endsWith('.png') ? 'png' : 'jpeg' };
      }
    }
  } catch (e) {}
  return null;
}

/** Dibuja el encabezado oficial de 3 columnas */
function drawOfficialHeader(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  title: string,
  code: string,
  contexto: GcmContexts
): number {
  const h = 22;
  const col1W = 40;
  const col3W = 45;
  const col2W = w - col1W - col3W;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);
  doc.rect(x, y, w, h);
  doc.line(x + col1W, y, x + col1W, y + h);
  doc.line(x + col1W + col2W, y, x + col1W + col2W, y + h);

  // Logo institucional
  try {
    const logoPath = resolveBackendResource(findImageFromContext(gcmContextFactory(contexto)));
    if (fs.existsSync(logoPath)) {
      const img: any = fs.readFileSync(logoPath);
      const ext = logoPath.endsWith('.png') ? 'png' : 'jpg';
      doc.addImage(img, ext, x + 5, y + 2, 30, 10);
    }
  } catch (e) {}

  // Título
  doc.setFontSize(10);
  doc.text(title, x + col1W + col2W / 2, y + 12, { align: 'center' });

  // Metadatos
  const metaX = x + col1W + col2W;
  const rowH = h / 4;
  for (let i = 1; i < 4; i++) doc.line(metaX, y + i * rowH, metaX + col3W, y + i * rowH);

  doc.setFontSize(5.5);
  const meta = [
    ['CÓDIGO:', code],
    ['VIGENCIA:', '05/03/2029'],
    ['VERSIÓN:', '01'],
    ['PÁGINA:', '1 de 1'],
  ];
  meta.forEach(([lbl, val], i) => {
    doc.setFont(FM.h, F.b);
    doc.text(lbl, metaX + 2, y + i * rowH + 3.5);
    doc.setFont(FM.h, F.n);
    doc.text(val, metaX + 18, y + i * rowH + 3.5);
  });

  return h;
}

/** Sección con fondo oscuro */
function drawSectionHeader(doc: jsPDF, label: string, x: number, y: number, w: number): number {
  const h = 7;
  doc.setFillColor(30, 30, 30);
  doc.rect(x, y, w, h, 'F');
  doc.setDrawColor(30, 30, 30);
  doc.rect(x, y, w, h);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(8);
  doc.setTextColor(255);
  doc.text(label.toUpperCase(), x + w / 2, y + 4.5, { align: 'center' });
  doc.setTextColor(0);
  return h;
}

/** Dibuja la tabla de notas con FECHA Y HORA (casilla única), NOTA y RESPONSABLE */
function drawNotasTable(
  doc: jsPDF,
  notas: any[],
  opts: { M: number; CW: number; PH: number; startY: number }
): number {
  let y = opts.startY;
  const colW = [32, opts.CW - 72, 40];
  const labels = ['FECHA Y HORA', 'NOTA', 'RESPONSABLE'];

  const drawTableHeader = (yy: number): number => {
    doc.setFont(FM.h, F.b);
    doc.setFontSize(8);
    doc.setFillColor(240, 240, 240);
    doc.rect(opts.M, yy, opts.CW, 7, 'F');
    let curX = opts.M;
    labels.forEach((lbl, i) => {
      doc.rect(curX, yy, colW[i], 7);
      doc.text(lbl, curX + colW[i] / 2, yy + 5, { align: 'center' });
      curX += colW[i];
    });
    return yy + 7;
  };

  if (y + 7 > opts.PH - opts.M) {
    doc.addPage();
    y = opts.M;
  }
  y = drawTableHeader(y);

  doc.setFont(FM.h, F.n);
  doc.setFontSize(8);

  notas.forEach((nota, idx) => {
    const txt = v(nota.nota);
    const lines = doc.splitTextToSize(txt, colW[1] - 4);
    const resp = v(nota.usuario?.nombre);
    const respLines = doc.splitTextToSize(resp, colW[2] - 4);
    const rowH = Math.max(8, lines.length * 4.5, respLines.length * 4.5);

    if (y + rowH > opts.PH - opts.M) {
      doc.addPage();
      y = opts.M;
      y = drawTableHeader(y);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(opts.M, y, opts.CW, rowH, 'F');
    }

    let rx = opts.M;
    doc.rect(rx, y, colW[0], rowH);
    const fechaHora = `${new Date(nota.fecha).toLocaleDateString()}\n${new Date(
      nota.fecha
    ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const fhLines = doc.splitTextToSize(fechaHora, colW[0] - 3);
    doc.text(fhLines, rx + colW[0] / 2, y + 5, { align: 'center' });
    rx += colW[0];

    doc.rect(rx, y, colW[1], rowH);
    doc.text(lines, rx + 2, y + 5);
    rx += colW[1];

    doc.rect(rx, y, colW[2], rowH);
    doc.text(respLines, rx + 2, y + 5);

    y += rowH;
  });

  return y + 3;
}

/** Genera las notas en flujo continuo: médicas y de enfermería comparten la misma página,
 *  el salto de página solo ocurre cuando el contenido no cabe */
function drawNotasPage(
  doc: jsPDF,
  contexto: GcmContexts,
  titulo: string,
  codigo: string,
  secciones: { titulo?: string; subtitulo?: string; notas: any[] }[],
  opts: { M: number; CW: number; PH: number }
): void {
  doc.addPage();
  let y = opts.M;
  y += drawOfficialHeader(doc, opts.M, y, opts.CW, titulo, codigo, contexto);
  y += 4;

  let lastTitulo = '';
  secciones.forEach((sec, idx) => {
    if (sec.titulo && sec.titulo !== lastTitulo) {
      if (idx > 0) y += 3;
      if (y + 8 > opts.PH - opts.M) {
        doc.addPage();
        y = opts.M;
      }
      y += drawSectionHeader(doc, sec.titulo, opts.M, y, opts.CW);
      y += 2;
      lastTitulo = sec.titulo;
    }
    if (sec.subtitulo) {
      y += 4;
      if (y + 8 > opts.PH - opts.M) {
        doc.addPage();
        y = opts.M;
      }
      y += drawSectionHeader(doc, sec.subtitulo, opts.M, y, opts.CW);
      y += 2;
    } else {
      y += 3;
    }
    y = drawNotasTable(doc, sec.notas, { M: opts.M, CW: opts.CW, PH: opts.PH, startY: y });
    y += 3;
  });
}

/** Campo de formulario estándar con bordes suavizados */
function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h = 10
): void {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);
  doc.rect(x, y, w, h);

  doc.setTextColor(80, 80, 80);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(5.5);
  doc.text(label.toUpperCase(), x + 1.5, y + 3);

  doc.setTextColor(0);
  doc.setFont(FM.h, F.n);
  doc.setFontSize(7);
  if (!value) return;

  const valTxt = String(value);
  const paragraphs = valTxt.split('\n');
  let ty = y + 6.5;
  const lineHeight = 3.2;

  for (const p of paragraphs) {
    const lines = doc.splitTextToSize(p, w - 3);
    for (let l of lines) {
      if (ty > y + h - 1) {
        doc.text('...', x + w - 3, ty - lineHeight);
        return;
      }
      doc.text(l, x + 1.5, ty);
      ty += lineHeight;
    }
  }
}

/** Campo de texto libre con auto-ajuste de altura dinámico según el contenido */
function drawDynamicField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  minH = 10
): number {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);

  doc.setFont(FM.h, F.b);
  doc.setFontSize(5.5);
  doc.setTextColor(80, 80, 80);

  const text = String(value || '');
  const paragraphs = text.split('\n');
  const lineHeight = 3.5;

  // Calcular líneas totales para la altura
  let totalLines = 0;
  paragraphs.forEach(p => {
    const cleanP = p.replace(/<b>/g, '').replace(/<\/b>/g, '');
    const lines = doc.splitTextToSize(cleanP, w - 3);
    totalLines += lines.length;
  });

  const calcH = Math.max(minH, 5 + totalLines * lineHeight);

  doc.rect(x, y, w, calcH);
  doc.text(label.toUpperCase(), x + 1.5, y + 3);

  doc.setTextColor(0);
  doc.setFontSize(7);

  let curY = y + 6.5;
  paragraphs.forEach(p => {
    if (p.includes('<b>')) {
      // Soporte básico para negritas en una línea (usado en procedimientos)
      const parts = p.split(/(<b>.*?<\/b>)/g);
      let curX = x + 1.5;
      parts.forEach(part => {
        if (part.startsWith('<b>') && part.endsWith('</b>')) {
          const content = part.substring(3, part.length - 4);
          doc.setFont(FM.h, F.b);
          doc.text(content, curX, curY);
          curX += doc.getTextWidth(content);
        } else {
          doc.setFont(FM.h, F.n);
          doc.text(part, curX, curY);
          curX += doc.getTextWidth(part);
        }
      });
      curY += lineHeight;
    } else {
      const lines = doc.splitTextToSize(p, w - 3);
      doc.setFont(FM.h, F.n);
      lines.forEach((l: string) => {
        doc.text(l, x + 1.5, curY);
        curY += lineHeight;
      });
    }
  });

  return calcH;
}

/** Checkbox estilo formulario */
function drawCheck(doc: jsPDF, label: string, active: boolean, x: number, y: number): void {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);
  doc.rect(x, y - 3, 3, 3);
  if (active) {
    doc.line(x, y - 3, x + 3, y);
    doc.line(x + 3, y - 3, x, y);
  }
  doc.setFont(FM.h, F.n);
  doc.setFontSize(7.5);
  doc.text(label, x + 4.5, y - 0.5);
}

// ─── Exportación Principal ────────────────────────────────────────────────────
export async function generateTrasladoSecundarioPdf(
  payload: TrasladoPdfPayload
): Promise<Buffer | null> {
  if (!payload || !payload.data) return null;

  const data = payload.data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 10;
  const CW = PW - M * 2;
  let Y = M;

  const tramos = data.tramos;
  const activeTramo = tramos.find((t: any) => t.isActivo) || tramos[tramos.length - 1];
  const p = data.paciente;
  const isRedondo = data.tipoRecorridoCode === TIPOS_TRASLADO.REDONDO.getCode();

  // Helper: último signo vital de un tramo específico (ordenado por fechaCreacion desc)
  const getLastSignoDeTramo = (tramo: any): Record<string, any> => {
    const signos = (tramo?.signosVitales || [])
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );
    return signos[0]?.item || {};
  };

  // Último signo vital global — ordenado correctamente por fechaCreacion
  const todosLosSignos = tramos
    .flatMap((t: any) => t.signosVitales || [])
    .sort(
      (a: any, b: any) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
  const currentCv = todosLosSignos[0]?.item || {};

  const getSub = (sigla: string, cv: Record<string, any> = currentCv) => {
    const key = sigla.toLowerCase();
    return cv[key]?.cantidad || '';
  };

  const chkPage = (h: number) => {
    if (Y + h > PH - M) {
      doc.addPage();
      Y = M;
    }
  };

  // Pre-cargar firma(s) en buffer nativo
  const firmaImgData = getLocalImageBuffer(activeTramo.firmaImg);
  const firmaTramo1 = isRedondo ? getLocalImageBuffer(tramos[0]?.firmaImg) : null;
  const firmaTramo2 = isRedondo ? getLocalImageBuffer(tramos[1]?.firmaImg) : null;

  // 1. Encabezado
  Y += drawOfficialHeader(
    doc,
    M,
    Y,
    CW,
    'FORMATO TRASLADO SECUNDARIO ASISTENCIAL',
    'REF-FT-13',
    payload.clinica.contexto
  );
  doc.rect(M, Y, CW, 4); // Espaciador
  doc.setFont(FM.h, F.b);
  doc.setFontSize(6);
  doc.text('Ambulancia Terrestre — Res. 2284/2023 Art. 7.1.2', PW / 2, Y + 2.8, {
    align: 'center',
  });
  Y += 4;

  // 2. Tiempos y Distancia
  Y += drawSectionHeader(
    doc,
    '1. TIEMPOS Y DISTANCIA DEL RECORRIDO (Numerales 7.1.2.8 – 7.1.2.16)',
    M,
    Y,
    CW
  );
  const wFecha = 45;
  const wKm = 32;
  const wTotal = CW - wFecha * 2 - wKm * 2;

  drawField(doc, 'FECHA/HORA INICIO', fmt(activeTramo.horaInicioRecorrido), M, Y, wFecha);
  drawField(doc, 'FECHA/HORA RECEPCIÓN', fmt(activeTramo.horaRecepcionInst), M + wFecha, Y, wFecha);
  drawField(doc, 'KM INICIAL (ODÓMETRO)', v(data.kmInicial), M + wFecha * 2, Y, wKm);
  drawField(
    doc,
    'KM FINAL (ODÓMETRO)',
    v(activeTramo.kmFinal || data.kmFinal),
    M + wFecha * 2 + wKm,
    Y,
    wKm
  );
  const totalKm =
    (Number(activeTramo.kmFinal || data.kmFinal) || 0) - (Number(data.kmInicial) || 0);
  drawField(
    doc,
    'TOTAL KM RECORRIDOS',
    totalKm > 0 ? String(totalKm) : '',
    M + wFecha * 2 + wKm * 2,
    Y,
    wTotal
  );
  Y += 10;

  doc.rect(M, Y, CW, 10);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(7.5);
  doc.text('TIPO DE RECORRIDO:', M + 2, Y + 6);
  // isRedondo calculado al inicio del generador
  drawCheck(doc, 'SIMPLE', !isRedondo, M + 45, Y + 6.5);
  drawCheck(doc, 'REDONDO', isRedondo, M + 75, Y + 6.5);
  Y += 10;

  if (isRedondo) {
    const descText = v(activeTramo.descripcionEspera);
    doc.setFont(FM.h, F.n);
    doc.setFontSize(8.5);

    const descMaxWidth = CW - 10;
    const descLines = doc.splitTextToSize(descText, descMaxWidth);
    const rH = Math.max(18, 16 + descLines.length * 4);

    chkPage(rH);
    doc.rect(M, Y, CW, rH);

    doc.setFont(FM.h, F.i);
    doc.setFontSize(7);
    doc.text(
      'Traslado redondo: la persona es llevada a otro procedimiento, la ambulancia espera y retorna al prestador de origen',
      M + 2,
      Y + 4.5
    );

    doc.setFont(FM.h, F.b);
    doc.setFontSize(7.5);
    doc.text('Si es traslado redondo: Tiempo de espera:', M + 2, Y + 10);
    doc.line(M + 55, Y + 10.5, M + 85, Y + 10.5);
    doc.setFont(FM.h, F.n);
    doc.setFontSize(8.5);
    doc.text(v(activeTramo.horasEspera), M + 56, Y + 10);

    doc.setFont(FM.h, F.b);
    doc.setFontSize(7.5);
    doc.text('Descripción:', M + 90, Y + 10);

    doc.setFont(FM.h, F.n);
    doc.setFontSize(8.5);
    doc.text(descLines, M + 5, Y + 15);

    Y += rH;
  }

  // 3. Datos del Paciente
  Y += drawSectionHeader(doc, '2. DATOS DEL PACIENTE (Numerales 7.1.2.1 – 7.1.2.4)', M, Y, CW);
  const hw = CW / 2;
  drawField(doc, 'NOMBRES COMPLETOS', v(p.nombres), M, Y, hw);
  drawField(doc, 'APELLIDOS COMPLETOS', v(p.apellidos), M + hw, Y, hw);
  Y += 10;
  const c5 = CW / 5;
  const tipoDocMap: Record<number, string> = { 1: 'CC', 2: 'TI', 3: 'RC', 4: 'CE', 5: 'PA' };
  drawField(doc, 'TIPO DOC.', v(tipoDocMap[p.documento?.tipoCode] || 'CC'), M, Y, c5);
  drawField(doc, 'N° DOCUMENTO', v(p.documento?.numero), M + c5, Y, c5);
  drawField(doc, 'EDAD', v(p.edad), M + c5 * 2, Y, 20);
  const genMap: Record<number, string> = { 1: 'MASCULINO', 2: 'FEMENINO' };
  drawField(doc, 'SEXO', v(genMap[p.generoCode]), M + c5 * 2 + 20, Y, 20);
  drawField(
    doc,
    'EPS / ASEGURADORA',
    v(p.afiliacionContrato?.nombre),
    M + c5 * 2 + 40,
    Y,
    CW - (c5 * 2 + 40)
  );
  Y += 10;

  drawField(doc, 'SERVICIO REQUERIDO', v(data.servicioRequerido?.nombre || 'N/A'), M, Y, CW - 70);
  doc.rect(M + CW - 70, Y, 70, 10);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(7);
  doc.text('ESTADO AL LLEGAR:', M + CW - 68, Y + 6);
  const isVivo = data.estadoPacienteCode === VIVO.getCode();
  drawCheck(doc, 'VIVO', isVivo, M + CW - 35, Y + 6.5);
  drawCheck(doc, 'MUERTO', !isVivo, M + CW - 18, Y + 6.5);
  Y += 10;

  // 4. Datos Clínicos
  chkPage(45);
  Y += drawSectionHeader(
    doc,
    `3. DATOS CLÍNICOS Y DIAGNÓSTICOS (Numerales 7.1.2.5 – 7.1.2.8)`,
    M,
    Y,
    CW
  );
  const svW = CW / 5;

  if (!isRedondo) {
    // Traslado SIMPLE: última fila de signos vitales global
    const vts = [
      ['T.A. (mmHg)', v(getSub('ta'))],
      ['F.C. (p/min)', v(getSub('fc'))],
      ['F.R. (r/min)', v(getSub('fr'))],
      ['SatO2 (%)', v(getSub('sato2'))],
      ['F.C.F. (p/min)', v(getSub('fcf'))],
    ];
    vts.forEach(([l, val], i) => drawField(doc, l, val, M + i * svW, Y, svW, 10));
    Y += 10;
    drawField(doc, 'GLASGOW', v(getSub('glasgow')), M, Y, CW / 2, 14);
    drawField(
      doc,
      'CÓDIGO CUPS DEL TRASLADO',
      `${v(data.cupsCode ? codigoCupsFactory(data.cupsCode).getForHumans() : '')}`,
      M + CW / 2,
      Y,
      CW / 2,
      14
    );
    Y += 14;
  } else {
    // Traslado REDONDO: último signo vital de tramo 1 (IDA) y tramo 2 (RETORNO)
    const cvIda = getLastSignoDeTramo(tramos[0]);
    const cvRetorno = getLastSignoDeTramo(tramos[1]);

    // Fila IDA
    doc.setFont(FM.h, F.b);
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 60);
    doc.text('SIGNOS VITALES — IDA (TRAMO 1):', M + 1, Y + 2.5);
    doc.setTextColor(0);
    Y += 4;
    [
      ['T.A. (mmHg)', v(getSub('ta', cvIda))],
      ['F.C. (p/min)', v(getSub('fc', cvIda))],
      ['F.R. (r/min)', v(getSub('fr', cvIda))],
      ['SatO2 (%)', v(getSub('sato2', cvIda))],
      ['F.C.F. (p/min)', v(getSub('fcf', cvIda))],
    ].forEach(([l, val], i) => drawField(doc, l, val, M + i * svW, Y, svW, 10));
    Y += 10;
    drawField(doc, 'GLASGOW (IDA)', v(getSub('glasgow', cvIda)), M, Y, CW / 2, 14);
    drawField(
      doc,
      'CÓDIGO CUPS DEL TRASLADO',
      `${v(data.cupsCode ? codigoCupsFactory(data.cupsCode).getForHumans() : '')}`,
      M + CW / 2,
      Y,
      CW / 2,
      14
    );
    Y += 14;

    // Fila RETORNO
    doc.setFont(FM.h, F.b);
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 60);
    doc.text('SIGNOS VITALES — RETORNO (TRAMO 2):', M + 1, Y + 2.5);
    doc.setTextColor(0);
    Y += 4;
    [
      ['T.A. (mmHg)', v(getSub('ta', cvRetorno))],
      ['F.C. (p/min)', v(getSub('fc', cvRetorno))],
      ['F.R. (r/min)', v(getSub('fr', cvRetorno))],
      ['SatO2 (%)', v(getSub('sato2', cvRetorno))],
      ['F.C.F. (p/min)', v(getSub('fcf', cvRetorno))],
    ].forEach(([l, val], i) => drawField(doc, l, val, M + i * svW, Y, svW, 10));
    Y += 10;
    drawField(doc, 'GLASGOW (RETORNO)', v(getSub('glasgow', cvRetorno)), M, Y, CW / 2, 14);
    Y += 14;
  }

  if (data.paciente?.diagnosticos?.length) {
    data.paciente.diagnosticos.slice(0, 3).forEach((diag: any) => {
      drawField(
        doc,
        'DIAGNÓSTICO (CIE-10)',
        `${v(diag.diagnostico?.codigo)} - ${v(diag.diagnostico?.nombre)}`,
        M,
        Y,
        CW,
        14
      );
      Y += 14;
    });
  }

  const todosLosProcedimientos = tramos.reduce(
    (acc: any[], t: any) => acc.concat(t.procedimientos || []),
    []
  );
  const todosLosMedicamentos = tramos.reduce(
    (acc: any[], t: any) => acc.concat(t.medicamentos || []),
    []
  );

  const procs = todosLosProcedimientos
    .map((p: any) => {
      const codigo = v(p.codigo);
      const nombre = v(p.nombre);

      return `• <b>${codigo}</b> - ${nombre}`;
    })
    .join('\n');
  const prsH = drawDynamicField(
    doc,
    'PROCEDIMIENTOS REALIZADOS DURANTE TRASLADO (CUPS)',
    v(procs),
    M,
    Y,
    CW,
    14
  );
  Y += prsH + 3;

  const formatMedItem = (m: any) => {
    if (!m) return '';
    const name = v(m.medicamento?.nombre || m.nombre);
    const codigo = v(m.medicamento?.codigo || m.codigo);
    if (!name) return '';
    const parts = [`<b>${codigo}</b> ` + name];
    if (m.dosis || m.cantidad) parts.push(`Dosis: ${m.dosis || m.cantidad}`);
    if (m.via || m.viaAdministracion) parts.push(`Vía: ${m.via || m.viaAdministracion}`);
    return `• ${parts.join(' — ')}`;
  };

  const meds = todosLosMedicamentos.map(formatMedItem).filter(Boolean).join('\n');
  const mdsH = drawDynamicField(
    doc,
    'MEDICAMENTOS, DOSIS, VÍA Y DISPOSITIVOS UTILIZADOS',
    v(meds),
    M,
    Y,
    CW,
    14
  );
  Y += mdsH + 4;

  // 4. Origen y Destino
  chkPage(55);
  Y += drawSectionHeader(doc, '4. ORIGEN Y DESTINO (Numerales 7.1.2.8 – 7.1.2.11)', M, Y, CW);

  doc.rect(M, Y, CW, 15);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(7);
  doc.text('MOTIVO TRASLADO:', M + 2, Y + 6);
  TIPO_REMISIONES_VALUES.forEach((lbl, i) =>
    drawCheck(
      doc,
      lbl.getForHumans(),
      data.tipoRemisionCode === lbl.getCode(),
      M + 30 + i * 40,
      Y + 6.5
    )
  );

  doc.setFont(FM.h, F.b);
  doc.setFontSize(7);
  doc.text('OTRO MOTIVO DE TRASLADO:', M + 2, Y + 12);
  doc.setFont(FM.h, F.n);
  doc.text(data.otroTipoRemision ? data.otroTipoRemision.toUpperCase() : '', M + 40, Y + 12);
  Y += 15;

  // Origen
  doc.setFillColor(245, 245, 245);
  doc.rect(M, Y, hw, 6, 'FD');
  doc.setFont(FM.h, F.b);
  doc.setFontSize(7);
  doc.text('INSTITUCION DE ORIGEN / REMITENTE', M + hw / 2, Y + 4.5, { align: 'center' });
  // Destino
  doc.rect(M + hw, Y, hw, 6, 'FD');
  doc.text('INSTITUCION RECEPTORA / DESTINO', M + hw + hw / 2, Y + 4.5, { align: 'center' });
  Y += 6;

  const orig = data.origen;
  const dest = data.destino;

  drawField(doc, 'NOMBRE IPS / INSTITUCIÓN', v(orig.nombre), M, Y, hw, 10);
  drawField(doc, 'NOMBRE IPS / INSTITUCIÓN', v(dest.nombre), M + hw, Y, hw, 10);
  Y += 10;

  drawField(doc, 'CÓDIGO REPS', v(orig.codigo), M, Y, 30, 10);
  drawField(doc, 'DIRECCIÓN', v(orig.direccion), M + 30, Y, hw - 30, 10);
  drawField(doc, 'CÓDIGO REPS', v(dest.codigo), M + hw, Y, 30, 10);
  drawField(doc, 'DIRECCIÓN', v(dest.direccion), M + hw + 30, Y, hw - 30, 10);
  Y += 10;

  drawField(
    doc,
    'MUNICIPIO / DEPARTAMENTO',
    `${v(orig.municipio?.nombre)} / ${v(orig.departamento?.nombre)}`,
    M,
    Y,
    hw,
    10
  );
  drawField(
    doc,
    'MUNICIPIO / DEPARTAMENTO',
    `${v(dest.municipio?.nombre)} / ${v(dest.departamento?.nombre)}`,
    M + hw,
    Y,
    hw,
    10
  );
  Y += 10;

  // 5. Complicaciones
  chkPage(35);
  const isCompl = v(activeTramo.ingresoIps) === 'true' || activeTramo.ingresoIps === true;
  const causaTxt = v(activeTramo.causaDesviacion);

  doc.setFont(FM.h, F.n);
  doc.setFontSize(8);
  const causaLines = isCompl ? doc.splitTextToSize(causaTxt, CW - 10) : [];
  const boxH = Math.max(22, 18 + causaLines.length * 4);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(M, Y, CW, boxH);
  doc.setLineWidth(0.15);

  doc.setFont(FM.h, F.n);
  doc.setFontSize(7.5);

  doc.text('Ingreso a IPS durante el recorrido por complicaciones:', M + 2, Y + 7);
  drawCheck(doc, 'No', !isCompl, M + 95, Y + 7.5);
  drawCheck(doc, 'Si', isCompl, M + 115, Y + 7.5);

  doc.text('Nota : En el caso de seleccionar si, mencionar causa:', M + 2, Y + 12);
  if (isCompl) {
    doc.setFont(FM.h, F.n);
    doc.setFontSize(8);
    doc.text(causaLines, M + 5, Y + 16);
  }

  const fila3Y = Y + boxH - 3;
  doc.setFont(FM.h, F.n);
  doc.setFontSize(7.5);
  doc.text('Nombre IPS', M + 2, fila3Y);
  doc.line(M + 20, fila3Y + 0.5, M + 90, fila3Y + 0.5);

  doc.text('Km desviación:', M + 95, fila3Y);
  doc.line(M + 118, fila3Y + 0.5, M + 145, fila3Y + 0.5);

  doc.text('Tiempo utilizado:', M + 150, fila3Y);
  doc.line(M + 175, fila3Y + 0.5, M + CW - 5, fila3Y + 0.5);

  if (isCompl) {
    doc.setFont(FM.h, F.b);
    doc.setFontSize(8);
    doc.text(v(activeTramo.nombreIps), M + 21, fila3Y);
    doc.text(v(activeTramo.kmDesviacion), M + 119, fila3Y);
    doc.text(v(activeTramo.tiempoUtilizado), M + 176, fila3Y);
  }

  Y += boxH + 4;

  // 6. Tripulación
  chkPage(45);
  Y += drawSectionHeader(doc, '5. TRIPULACIÓN Y PROFESIONAL RECEPTOR (Res. 3100/2019)', M, Y, CW);
  const q3 = CW / 3;
  const asig = data.asignacionActual || {};
  const cnd = asig.conductor;
  const axl = asig.auxiliar;
  const md = asig.medico;

  drawField(doc, 'CONDUCTOR', getUsuarioLabel(cnd?.nombre, cnd?.documento), M, Y, q3, 12);
  drawField(
    doc,
    'AUXILIAR ENFERMERÍA',
    getUsuarioLabel(axl?.nombre, axl?.documento),
    M + q3,
    Y,
    q3,
    12
  );
  drawField(doc, 'MÉDICO', getUsuarioLabel(md?.nombre, md?.documento), M + q3 * 2, Y, q3, 12);
  Y += 12;

  drawField(
    doc,
    'ACOMPAÑANTE DEL PACIENTE',
    getUsuarioLabel(data.acompananteNombre, data.acompananteDocumento),
    M,
    Y,
    q3,
    12
  );
  drawField(doc, 'VEHÍCULO (PLACA)', `Placa: ${v(data.vehiculo?.placa)}`, M + q3, Y, q3 * 2, 12);
  Y += 12;

  drawField(
    doc,
    'PROFESIONAL/TECNÓLOGO QUE RECIBE (IPS DESTINO)',
    getUsuarioLabel(
      activeTramo.recibidoPorNombre || data.recibidoPorNombre,
      activeTramo.recibidoPorDocumento || data.recibidoPorDocumento
    ),
    M,
    Y,
    CW,
    12
  );
  Y += 12;
  chkPage(25);
  const obsH = drawDynamicField(
    doc,
    'OBSERVACIONES DEL TRASLADO',
    v(data.observacion),
    M,
    Y,
    CW,
    20
  );
  Y += obsH + 5;

  // Firmas espacio con inyección binaria nativa y diseño premium de Acta
  chkPage(35);

  const isMedicalizado =
    data.tipoTrasladoCode === MEDICALIZADO.getCode() ||
    data.tipoTrasladoCode === MEDICALIZADO_NEONATAL.getCode();

  const asigFinal = data.asignacionActual || {};
  const firmaConductor = getFirmaBufferFromCedula(asigFinal.conductor?.documento);
  const firmaAuxiliar = getFirmaBufferFromCedula(asigFinal.auxiliar?.documento);
  const firmaMedico = isMedicalizado ? getFirmaBufferFromCedula(asigFinal.medico?.documento) : null;

  // ── Fila 1: Tripulación + (firma IPS si es simple) ──────────────────────────
  const numFirmasFila1 = (isMedicalizado ? 3 : 2) + (isRedondo ? 0 : 1);
  const firmaW = CW / numFirmasFila1;

  let curFirma = 0;
  const baseFirmaY = Y;
  const lineY = baseFirmaY + 18;

  const drawFirmaCol = (
    bufferObj: any,
    nombreLabel: string,
    cargoLabel: string,
    colW: number,
    baseY: number,
    offsetX: number
  ) => {
    const startX = offsetX + colW * curFirma;
    const lY = baseY + 18;
    if (bufferObj) {
      doc.addImage(
        bufferObj.buffer,
        bufferObj.ext,
        startX + 5,
        baseY + 1,
        colW - 10,
        16,
        undefined,
        'FAST'
      );
    }
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.2);
    doc.line(startX + 4, lY, startX + colW - 4, lY);

    doc.setTextColor(0);
    doc.setFont(FM.h, F.b);
    doc.setFontSize(6.5);
    doc.text(nombreLabel.toUpperCase(), startX + colW / 2, lY + 3.5, { align: 'center' });

    doc.setTextColor(100);
    doc.setFont(FM.h, F.n);
    doc.setFontSize(5.5);
    doc.text(cargoLabel.toUpperCase(), startX + colW / 2, lY + 6.5, { align: 'center' });

    curFirma++;
  };

  drawFirmaCol(
    firmaConductor,
    v(asigFinal.conductor?.nombre, 'CONDUCTOR ASIGNADO'),
    'FIRMA CONDUCTOR',
    firmaW,
    baseFirmaY,
    M
  );
  drawFirmaCol(
    firmaAuxiliar,
    v(asigFinal.auxiliar?.nombre, 'AUXILIAR ASIGNADO'),
    'FIRMA AUXILIAR',
    firmaW,
    baseFirmaY,
    M
  );
  if (isMedicalizado) {
    drawFirmaCol(
      firmaMedico,
      v(asigFinal.medico?.nombre, 'MÉDICO ASIGNADO'),
      'FIRMA MÉDICO',
      firmaW,
      baseFirmaY,
      M
    );
  }
  if (!isRedondo) {
    // Traslado SIMPLE: firma IPS en la misma fila que la tripulación
    drawFirmaCol(
      firmaImgData,
      v(activeTramo.recibidoPorNombre || data.recibidoPorNombre, 'RECEPCIÓN IPS'),
      'SELLO / FIRMA IPS RECEPTORA',
      firmaW,
      baseFirmaY,
      M
    );
  }

  Y += 28;

  if (isRedondo) {
    // ── Fila 2: Firmas IPS IDA y RETORNO (cada una ocupa la mitad del ancho) ──
    chkPage(28);
    const firmaIpsW = CW / 2;
    let curIps = 0;
    const baseIpsY = Y;

    const drawIpsFirma = (bufferObj: any, nombreLabel: string, cargoLabel: string) => {
      const startX = M + firmaIpsW * curIps;
      const lY = baseIpsY + 18;
      if (bufferObj) {
        doc.addImage(
          bufferObj.buffer,
          bufferObj.ext,
          startX + 5,
          baseIpsY + 1,
          firmaIpsW - 10,
          16,
          undefined,
          'FAST'
        );
      }
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.2);
      doc.line(startX + 4, lY, startX + firmaIpsW - 4, lY);
      doc.setTextColor(0);
      doc.setFont(FM.h, F.b);
      doc.setFontSize(6.5);
      doc.text(nombreLabel.toUpperCase(), startX + firmaIpsW / 2, lY + 3.5, { align: 'center' });
      doc.setTextColor(100);
      doc.setFont(FM.h, F.n);
      doc.setFontSize(5.5);
      doc.text(cargoLabel.toUpperCase(), startX + firmaIpsW / 2, lY + 6.5, { align: 'center' });
      curIps++;
    };

    drawIpsFirma(
      firmaTramo1,
      v(tramos[0]?.recibidoPorNombre, 'RECEPCIÓN IPS (IDA)'),
      'FIRMA IPS DESTINO — IDA'
    );
    drawIpsFirma(
      firmaTramo2,
      v(tramos[1]?.recibidoPorNombre, 'RECEPCIÓN IPS (RETORNO)'),
      'FIRMA IPS DESTINO — RETORNO'
    );

    Y += 28;
  }

  // Pie de Página
  doc.setFontSize(6);
  doc.setTextColor(80);
  doc.setFont(FM.h, F.b);
  const fL = `Soporte de traslado secundario interinstitucional (Res. 2284/2023). \nDocumento generado el: ${new Date().toLocaleString(
    'es-CO'
  )}`;
  doc.text(fL, PW / 2, PH - 8, { align: 'center' });

  // Notas Médicas y de Enfermería en flujo continuo (salto de página solo si no caben)
  const notasPorTramo = (tramo: any, tipoCode: number): any[] =>
    (tramo?.notas || [])
      .filter((n: any) => n?.usuario?.tipoEmpleadoCode === tipoCode)
      .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const seccionesNotas: { titulo?: string; subtitulo?: string; notas: any[] }[] = [];
  const agregarSeccionTipo = (titulo: string, tipoCode: number): void => {
    if (!isRedondo) {
      const notas = tramos
        .flatMap((t: any) => t.notas || [])
        .filter((n: any) => n?.usuario?.tipoEmpleadoCode === tipoCode)
        .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      if (notas.length) seccionesNotas.push({ titulo, notas });
      return;
    }
    const ida = notasPorTramo(tramos[0], tipoCode);
    const retorno = notasPorTramo(tramos[1], tipoCode);
    if (ida.length) seccionesNotas.push({ titulo, subtitulo: 'TRAMO 1 (IDA)', notas: ida });
    if (retorno.length)
      seccionesNotas.push({ titulo, subtitulo: 'TRAMO 2 (RETORNO)', notas: retorno });
  };

  agregarSeccionTipo('NOTAS MÉDICAS', TIPOS_EMPLEADO.MEDICO.getCode());
  agregarSeccionTipo('NOTAS DE ENFERMERÍA', TIPOS_EMPLEADO.AUXILIAR.getCode());

  if (seccionesNotas.length > 0) {
    const tieneMedicas = seccionesNotas.some(s => s.titulo === 'NOTAS MÉDICAS');
    const tieneEnfermeria = seccionesNotas.some(s => s.titulo === 'NOTAS DE ENFERMERÍA');
    drawNotasPage(
      doc,
      payload.clinica.contexto,
      tieneMedicas && tieneEnfermeria
        ? 'NOTAS MÉDICAS Y DE ENFERMERÍA'
        : tieneMedicas
          ? 'NOTAS MÉDICAS'
          : 'NOTAS DE ENFERMERÍA',
      tieneMedicas && tieneEnfermeria ? 'ASI-FT-35/36' : tieneMedicas ? 'ASI-FT-36' : 'ASI-FT-35',
      seccionesNotas,
      { M, CW, PH }
    );
  }

  return Buffer.from(doc.output('arraybuffer'));
}
