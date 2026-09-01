import jsPDF from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
import { TrasladoAsistencialDetalleDataRes } from '../../application/responses';
import { generoTypeFactory, tipoDocumentoTypeFactory } from '@hpn/lgc/tas/types/gen';
import { TIPOS_EMPLEADO } from '@hpn/lgc/tas/types/gcn';
import {
  codigoCupsFactory,
  MOTIVO_TRASLADO_PRIM_VALUE,
  MOTIVO_TRASLADO_PRIM_VALUES,
  VIVO,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import { GcmContexts } from '@common/domain/types';

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

const findImageFromContext = (contexto: GcmContexts) => {
  return `private/clinicas/${
    contexto === GcmContexts.ALTACENTRO
      ? 'alta-centro.jpg'
      : contexto === GcmContexts.AGUACHICA
        ? 'aguachica.jpg'
        : contexto === GcmContexts.AMMEDICAL
          ? 'ammedical.png'
          : contexto === GcmContexts.SANJUAN
            ? 'sanjuan.jpg'
            : contexto === GcmContexts.VALLEDUPAR
              ? 'valledupar.jpg'
              : 'undefined.jpg'
  }`;
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
    const logoPath = resolveBackendResource(findImageFromContext(contexto));
    if (fs.existsSync(logoPath)) {
      const img: any = fs.readFileSync(logoPath);
      const ext = logoPath.endsWith('.png') ? 'png' : 'jpg';
      doc.addImage(img, ext, x + 5, y + 2, 30, 10);
    }
  } catch (e) {
    doc.setFont(FM.h, F.b);
    doc.setFontSize(7);
    doc.text('CLÍNICA', x + 15, y + 8);
  }

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
    ['VERSIÓN:', '04'],
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
  const h = 5.5;
  doc.setFillColor(30, 30, 30);
  doc.rect(x, y, w, h, 'F');
  doc.setDrawColor(30, 30, 30);
  doc.rect(x, y, w, h);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(6.5);
  doc.setTextColor(255);
  doc.text(label.toUpperCase(), x + w / 2, y + 4, { align: 'center' });
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
    const fechaHora = `${new Date(nota.fechaRegistro).toLocaleDateString()}\n${new Date(
      nota.fechaRegistro
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
  h = 8.5
): void {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);
  doc.rect(x, y, w, h);

  doc.setTextColor(80, 80, 80);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(5);
  doc.text(label.toUpperCase(), x + 1, y + 2.5);

  doc.setTextColor(0);
  doc.setFont(FM.h, F.n);
  doc.setFontSize(6.5);
  if (!value) return;

  const valTxt = String(value);
  const paragraphs = valTxt.split('\n');
  let ty = y + 5.5;
  const lineHeight = 2.5;

  for (const p of paragraphs) {
    const lines = doc.splitTextToSize(p, w - 2);
    for (let l of lines) {
      if (ty > y + h - 1) {
        doc.text('...', x + w - 3, ty - lineHeight);
        return;
      }
      doc.text(l, x + 1, ty);
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
  minH = 8.5
): number {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);

  doc.setFont(FM.h, F.b);
  doc.setFontSize(5);
  doc.setTextColor(80, 80, 80);

  const text = String(value || '');
  const paragraphs = text.split('\n');
  const lineHeight = 2.8;

  // Calcular líneas totales para la altura
  let totalLines = 0;
  paragraphs.forEach(p => {
    const cleanP = p.replace(/<b>/g, '').replace(/<\/b>/g, '');
    const lines = doc.splitTextToSize(cleanP, w - 2);
    totalLines += lines.length;
  });

  const calcH = Math.max(minH, 4 + totalLines * lineHeight);

  doc.rect(x, y, w, calcH);
  doc.text(label.toUpperCase(), x + 1, y + 2.5);

  doc.setTextColor(0);
  doc.setFontSize(6.5);

  let curY = y + 5.5;
  paragraphs.forEach(p => {
    if (p.includes('<b>')) {
      const parts = p.split(/(<b>.*?<\/b>)/g);
      let curX = x + 1;
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
      const lines = doc.splitTextToSize(p, w - 2);
      doc.setFont(FM.h, F.n);
      lines.forEach((l: string) => {
        doc.text(l, x + 1, curY);
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
  doc.rect(x, y - 2.5, 2.5, 2.5);
  if (active) {
    doc.line(x, y - 2.5, x + 2.5, y);
    doc.line(x + 2.5, y - 2.5, x, y);
  }
  doc.setFont(FM.h, F.n);
  doc.setFontSize(5.5);
  doc.text(label, x + 3.5, y - 0.2);
}

// ─── Exportación Principal ────────────────────────────────────────────────────
export async function generateTrasladoPrimarioPdf(
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

  const tramos = data.tramos ?? [];
  const activeTramo = tramos.find(t => t.isActivo) || tramos[tramos.length - 1];
  const p = data.paciente;

  // Obtener los últimos signos vitales
  const todosLosSignos = tramos
    .flatMap(t => t.signosVitales || [])
    .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  const currentCv = todosLosSignos[0]?.item || {};

  const getSub = (sigla: string) => {
    const key = sigla.toLowerCase();
    return currentCv[key]?.cantidad || '';
  };

  const chkPage = (h: number) => {
    if (Y + h > PH - M) {
      doc.addPage();
      Y = M;
    }
  };

  // Cargar imágenes con buffers nativos mediante fs.readFileSync usando la propiedad correcta firmaImg
  const bodyMapImgData = getLocalImageBuffer(data.triageImg, 'triage');
  const firmaImgData = getLocalImageBuffer(activeTramo.firmaImg || data.firmaImg, 'firma');

  // 1. Encabezado
  Y += drawOfficialHeader(
    doc,
    M,
    Y,
    CW,
    'FORMATO TRASLADO PRIMARIO ASISTENCIAL',
    'REF-FT-04',
    payload.clinica.contexto
  );
  doc.rect(M, Y, CW, 4); // Espaciador
  doc.setFont(FM.h, F.b);
  doc.setFontSize(6);
  doc.text('Ambulancia Terrestre — Res. 2284/2023 Art. 7.1.1', PW / 2, Y + 2.8, {
    align: 'center',
  });
  Y += 4;

  const c5 = CW / 5;

  // 1. Tiempos Operacionales
  Y += drawSectionHeader(doc, '1. TIEMPOS OPERACIONALES DEL TRASLADO', M, Y, CW);

  const tts = [
    ['Despacho', fmt(activeTramo.horaDespacho)],
    ['Llegada escena', fmt(activeTramo.horaLlegadaEscena)],
    ['Salida escena', fmt(activeTramo.horaSalidaEscena)],
    ['Llegada inst.', fmt(activeTramo.horaLlegadaInst)],
    ['Recepción', fmt(activeTramo.horaRecepcionInst)],
  ];
  tts.forEach(([lbl, val], i) => drawField(doc, lbl, val, M + i * c5, Y, c5, 10));
  Y += 10;

  // 2. Datos del Paciente
  Y += drawSectionHeader(doc, '2. DATOS DEL PACIENTE', M, Y, CW);
  const hw = CW / 2;
  drawField(doc, 'Nombres', v(p.nombres), M, Y, hw);
  drawField(doc, 'Apellidos', v(p.apellidos), M + hw, Y, hw);
  Y += 8.5;
  const tipoDocumento = tipoDocumentoTypeFactory(p.documento?.tipoCode || 0);
  drawField(doc, 'Tipo documento', v(tipoDocumento.getForHumans()), M, Y, c5);
  drawField(doc, 'Número de documento', v(p.documento?.numero), M + c5, Y, c5);
  drawField(doc, 'Edad', v(p.edad), M + c5 * 2, Y, 20);
  const sexo = generoTypeFactory(p.generoCode as any);
  drawField(doc, 'Sexo biológico', v(sexo.getForHumans()), M + c5 * 2 + 20, Y, 20);
  Y += 8.5;
  const w3 = CW / 3;
  drawField(doc, 'EPS', v(p.afiliacionContrato?.nombre), M, Y, w3);
  drawField(doc, 'SOAT', v(p.soat), M + w3, Y, w3);
  drawField(doc, 'ARL', v(p.arl?.nombre), M + w3 * 2, Y, w3);
  Y += 10;

  // 3. Datos Clínicos y Signos Vitales
  chkPage(45);
  Y += drawSectionHeader(doc, '3. DATOS CLÍNICOS Y SIGNOS VITALES', M, Y, CW);

  const leftW = 40;
  doc.rect(M, Y, leftW, 35);
  if (bodyMapImgData) {
    doc.addImage(bodyMapImgData.buffer, bodyMapImgData.ext, M + 1, Y + 1, leftW - 2, 33);
  } else {
    doc.setFont(FM.h, F.i);
    doc.setFontSize(5.5);
    doc.setTextColor(150);
    doc.text('[ Sin imagen de mapa corporal ]', M + 20, Y + 18, { align: 'center' });
    doc.setTextColor(0);
  }

  const svX = M + leftW;
  const svW = CW - leftW;
  const cw = svW / 4;

  const svs1 = [
    ['T.A. (mmHg)', v(getSub('ta'))],
    ['F.C. (p/min)', v(getSub('fc'))],
    ['F.R. (r/min)', v(getSub('fr'))],
    ['SatO2 (%)', v(getSub('sato2'))],
  ];
  svs1.forEach(([l, val], i) => drawField(doc, l, val, svX + i * cw, Y, cw, 8));

  const svs2 = [
    ['F.C.F. (p/min)', v(getSub('fcf'))],
    ['PESO (kg)', v(getSub('peso'))],
    ['TALLA (cm)', v(getSub('talla'))],
    ['TEMP (°C)', v(getSub('temp'))],
  ];
  svs2.forEach(([l, val], i) => {
    if (l) drawField(doc, l, val, svX + i * cw, Y + 8, cw, 8);
  });

  drawField(doc, 'GLASGOW', v(getSub('glasgow')), svX, Y + 16, svW / 2, 8);
  drawField(
    doc,
    'CÓDIGO CUPS DEL TRASLADO',
    `${v(data.cupsCode ? codigoCupsFactory(data.cupsCode).getForHumans() : '')}`,
    svX + svW / 2,
    Y + 16,
    svW / 2,
    8
  );

  doc.setFont(FM.h, F.b);
  doc.text('Estado al ingreso:', svX + 2, Y + 27);
  const isVivo = data.estadoPacienteCode === VIVO.getCode();
  drawCheck(doc, 'VIVO', isVivo, svX + 30, Y + 27);
  drawCheck(doc, 'FALLECIDO', !isVivo, svX + 45, Y + 27);
  Y += 35;

  // 4. Traslado (Datos) e Instituciones
  Y += drawSectionHeader(doc, '4. DATOS DEL TRASLADO', M, Y, CW);
  doc.rect(M, Y, CW, 8);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(5);
  doc.text('MOTIVO TRASLADO:', M + 2, Y + 4.5);
  MOTIVO_TRASLADO_PRIM_VALUES.forEach((lbl, i) =>
    drawCheck(
      doc,
      lbl.getForHumans(),
      data.tipoRemisionCode === lbl.getCode(),
      M + 30 + i * 35,
      Y + 6.5
    )
  );

  if (
    MOTIVO_TRASLADO_PRIM_VALUE.OTRO.getCode() === data.tipoRemisionCode &&
    data.otroTipoRemision
  ) {
    doc.setFont(FM.h, F.i);
    doc.text(`Cual?: ${data.otroTipoRemision.toUpperCase()}`, M + 35 + 3 * 28 + 15, Y + 4.8);
  }

  Y += 8;
  const orig = data.origen;
  const dest = data.destino;

  doc.setFillColor(245, 245, 245);
  doc.rect(M, Y, hw, 5.5, 'F');
  doc.setDrawColor(180, 180, 180);
  doc.rect(M, Y, hw, 5.5);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(5.5);
  doc.setTextColor(0);
  doc.text('INSTITUCIÓN DE ORIGEN / REMITENTE', M + hw / 2, Y + 3.8, { align: 'center' });

  doc.setFillColor(0, 0, 0);
  doc.rect(M + hw, Y, hw, 5.5, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.rect(M + hw, Y, hw, 5.5);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(5.5);
  doc.setTextColor(255);
  doc.text('INSTITUCIÓN DE DESTINO / RECEPTORA', M + hw + hw / 2, Y + 3.8, { align: 'center' });
  doc.setTextColor(0);

  Y += 5.5;

  drawField(doc, 'Nombre IPS / Institución', v(orig.nombre), M, Y, hw, 7.5);
  drawField(doc, 'Nombre IPS / Institución', v(dest.nombre), M + hw, Y, hw, 7.5);
  Y += 7.5;

  const wReps = 25;
  const wDir = hw - wReps;

  drawField(doc, 'Código Reps', v(orig.codigo), M, Y, wReps, 7.5);
  drawField(doc, 'Dirección', v(orig.direccion), M + wReps, Y, wDir, 7.5);

  drawField(doc, 'Código Reps', v(dest.codigo), M + hw, Y, wReps, 7.5);
  drawField(doc, 'Dirección', v(dest.direccion), M + hw + wReps, Y, wDir, 7.5);
  Y += 7.5;

  const getMunDep = (obj: any) => {
    if (!obj?.municipio) return 'N/A';
    const mName = obj.municipio.nombre || '';
    const dName = obj.departamento?.nombre || '';
    return [mName, dName].filter(Boolean).join(' / ');
  };

  drawField(doc, 'Municipio / Departamento', v(getMunDep(orig)), M, Y, hw, 7.5);
  drawField(doc, 'Municipio / Departamento', v(getMunDep(dest)), M + hw, Y, hw, 7.5);
  Y += 8.5;

  drawField(
    doc,
    'DIAGNÓSTICO PRINCIPAL (CIE-10)',
    `${v(data.diagnostico?.codigo)} - ${v(data.diagnostico?.nombre)}`,
    M,
    Y,
    CW,
    10
  );
  Y += 10;
  if (data.diagSecundario?.nombre) {
    drawField(
      doc,
      'DIAGNÓSTICO SECUNDARIO (CIE-10)',
      `${v(data.diagSecundario?.codigo)} - ${v(data.diagSecundario?.nombre)}`,
      M,
      Y,
      CW,
      10
    );
    Y += 10;
  }
  const hallH = drawDynamicField(doc, 'Hallazgos clínicos', v(data.hallazgos), M, Y, CW, 14);
  Y += hallH + 3;

  // 6. Procedimientos
  chkPage(30);
  Y += drawSectionHeader(doc, '5. PROCEDIMIENTOS Y MEDICAMENTOS', M, Y, CW);
  const todosLosProcedimientos = tramos.reduce(
    (acc: any[], t: any) => acc.concat(t.procedimientos || []),
    []
  );
  const todosLosMedicamentos = tramos.reduce(
    (acc: any[], t: any) => acc.concat(t.medicamentos || []),
    []
  );

  const prcs = todosLosProcedimientos
    .map((p: any) => {
      const codigo = v(p.codigo);
      const nombre = v(p.nombre);

      return `• <b>${codigo}</b> - ${nombre}`;
    })
    .join('\n');
  const prcH = drawDynamicField(doc, 'PROCEDIMIENTOS REALIZADOS (CUPS)', v(prcs), M, Y, CW, 10);
  Y += prcH + 2;

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

  const mds = todosLosMedicamentos.map(formatMedItem).filter(Boolean).join('\n');
  const medH = drawDynamicField(
    doc,
    'MEDICAMENTOS, DOSIS, VÍA Y DISPOSITIVOS UTILIZADOS',
    v(mds),
    M,
    Y,
    CW,
    10
  );
  Y += medH + 4;

  chkPage(15);
  const obsH = drawDynamicField(
    doc,
    'OBSERVACIONES DEL TRASLADO',
    v(data.observacion),
    M,
    Y,
    CW,
    12
  );
  Y += obsH + 4;

  // 7. Tripulación
  chkPage(40);
  Y += drawSectionHeader(doc, '6. TRIPULACIÓN Y FIRMAS (Res. 2284/2023)', M, Y, CW);
  const asig = data.asignacionActual || {};
  const cnd = asig.conductor;
  const axl = asig.auxiliar;
  const med = asig.medico;
  const cq = CW / 3;
  drawField(doc, 'CONDUCTOR', getUsuarioLabel(cnd?.nombre, cnd?.documento), M, Y, cq);
  drawField(
    doc,
    'AUXILIAR EN ENFERMERÍA',
    getUsuarioLabel(axl?.nombre, axl?.documento),
    M + cq,
    Y,
    cq
  );
  drawField(doc, 'MÉDICO', getUsuarioLabel(med?.nombre, med?.documento), M + cq * 2, Y, cq);
  Y += 8.5;
  drawField(
    doc,
    'ACOMPAÑANTE DEL PACIENTE (C.C.)',
    getUsuarioLabel(data.acompananteNombre, data.acompananteDocumento),
    M,
    Y,
    cq
  );
  drawField(doc, 'VEHÍCULO (PLACA)', v(data.vehiculo?.placa), M + cq, Y, cq);
  drawField(
    doc,
    'RECIBIDO EN IPS ORIGEN/DESTINO',
    getUsuarioLabel(
      activeTramo.recibidoPorNombre || data.recibidoPorNombre,
      activeTramo.recibidoPorDocumento || data.recibidoPorDocumento
    ),
    M + cq * 2,
    Y,
    cq
  );
  Y += 12;

  // Firmas premium con inyección binaria nativa
  chkPage(35);

  const isMedicalizado = data.tipoTrasladoCode === 2 || data.tipoTrasladoCode === 3;
  const numFirmas = isMedicalizado ? 4 : 3;
  const firmaW = CW / numFirmas;

  const asigFinal = data.asignacionActual || {};
  const firmaConductor = getFirmaBufferFromCedula(asigFinal.conductor?.documento);
  const firmaAuxiliar = getFirmaBufferFromCedula(asigFinal.auxiliar?.documento);
  const firmaMedico = isMedicalizado ? getFirmaBufferFromCedula(asigFinal.medico?.documento) : null;

  let curFirma = 0;
  const baseFirmaY = Y;
  const lineY = baseFirmaY + 15;

  const drawFirmaColPrimario = (bufferObj: any, nombreLabel: string, cargoLabel: string) => {
    const startX = M + firmaW * curFirma;
    if (bufferObj) {
      doc.addImage(
        bufferObj.buffer,
        bufferObj.ext,
        startX + 5,
        baseFirmaY + 1,
        firmaW - 10,
        13,
        undefined,
        'FAST'
      );
    }
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.2);
    doc.line(startX + 3, lineY, startX + firmaW - 3, lineY);

    doc.setTextColor(0);
    doc.setFont(FM.h, F.b);
    doc.setFontSize(6);
    doc.text(nombreLabel.toUpperCase(), startX + firmaW / 2, lineY + 3, { align: 'center' });

    doc.setTextColor(100);
    doc.setFont(FM.h, F.n);
    doc.setFontSize(5);
    doc.text(cargoLabel.toUpperCase(), startX + firmaW / 2, lineY + 5.5, { align: 'center' });

    curFirma++;
  };

  drawFirmaColPrimario(
    firmaConductor,
    v(asigFinal.conductor?.nombre, 'CONDUCTOR ASIGNADO'),
    'FIRMA CONDUCTOR'
  );
  drawFirmaColPrimario(
    firmaAuxiliar,
    v(asigFinal.auxiliar?.nombre, 'AUXILIAR ASIGNADO'),
    'FIRMA AUXILIAR'
  );
  if (isMedicalizado) {
    drawFirmaColPrimario(
      firmaMedico,
      v(asigFinal.medico?.nombre, 'MÉDICO ASIGNADO'),
      'FIRMA MÉDICO'
    );
  }
  drawFirmaColPrimario(
    firmaImgData,
    v(activeTramo.recibidoPorNombre || data.recibidoPorNombre, 'RECEPCIÓN IPS'),
    'SELLO / FIRMA INSTITUCIÓN'
  );

  Y += 23;

  // Pie de Página
  doc.setFontSize(5);
  doc.setTextColor(80);
  doc.setFont(FM.h, F.b);
  const fL1 = `Soporte de traslado asistencial primario conforme a la Res. 2284/2023 y Res. 3100/2019. \nDocumento generado el: ${new Date().toLocaleString(
    'es-CO'
  )}`;
  doc.text(fL1, PW / 2, PH - 8, { align: 'center' });

  // Notas Médicas y de Enfermería en flujo continuo (salto de página solo si no caben)
  const notasPorTipo = (tipoCode: number): any[] =>
    tramos
      .flatMap(t => t.notas || [])
      .filter(n => n?.usuario?.tipoEmpleadoCode === tipoCode)
      .sort((a, b) => new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime());

  const notasMedicas = notasPorTipo(TIPOS_EMPLEADO.MEDICO.getCode());
  const notasEnfermeria = notasPorTipo(TIPOS_EMPLEADO.AUXILIAR.getCode());

  const seccionesNotas: { titulo?: string; notas: any[] }[] = [];
  if (notasMedicas.length) seccionesNotas.push({ titulo: 'NOTAS MÉDICAS', notas: notasMedicas });
  if (notasEnfermeria.length)
    seccionesNotas.push({ titulo: 'NOTAS DE ENFERMERÍA', notas: notasEnfermeria });

  if (seccionesNotas.length > 0) {
    const tieneMedicas = notasMedicas.length > 0;
    const tieneEnfermeria = notasEnfermeria.length > 0;
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
