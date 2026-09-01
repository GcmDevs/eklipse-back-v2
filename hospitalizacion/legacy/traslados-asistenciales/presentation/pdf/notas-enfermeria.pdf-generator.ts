import jsPDF from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
import { GcmContexts } from '@common/application/constants';
import { TIPOS_EMPLEADO } from '@hpn/lgc/tas/types/gcn';
import { TrasladoAsistencialDetalleDataRes } from '../../application/responses';

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
  val !== undefined && val !== null && val !== '' && val !== 'null' ? String(val) : fb;

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
  const isSubdir = /[\\\/]\d+$/.test(process.cwd());
  const backendRoot = isSubdir ? path.resolve(process.cwd(), '..') : process.cwd();
  return path.resolve(backendRoot, relativePath);
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

  try {
    const logoPath = resolveBackendResource(findImageFromContext(contexto));
    if (fs.existsSync(logoPath)) {
      const img: any = fs.readFileSync(logoPath);
      const ext = logoPath.endsWith('.png') ? 'png' : 'jpg';
      doc.addImage(img, ext, x + 5, y + 2, 30, 10);
    }
  } catch (e) {}

  doc.setFont(FM.h, F.b);
  doc.setFontSize(13);
  doc.text(title, x + col1W + col2W / 2, y + 13, { align: 'center' });

  const metaX = x + col1W + col2W;
  const rowH = h / 4;
  for (let i = 1; i < 4; i++) doc.line(metaX, y + i * rowH, metaX + col3W, y + i * rowH);

  doc.setFontSize(9);
  const meta = [
    ['CÓDIGO:', code],
    ['VIGENCIA:', '01/01/2026'],
    ['VERSIÓN:', '1.0'],
    ['PÁGINA:', '1 de 1'],
  ];
  meta.forEach(([lbl, val], i) => {
    doc.setFont(FM.h, F.b);
    doc.text(lbl, metaX + 2, y + i * rowH + 4);
    doc.setFont(FM.h, F.n);
    doc.text(val, metaX + 18, y + i * rowH + 4);
  });

  return h;
}

function drawSectionHeader(doc: jsPDF, label: string, x: number, y: number, w: number): number {
  const h = 8;
  doc.setFillColor(0, 0, 0);
  doc.rect(x, y, w, h, 'F');
  doc.setFont(FM.h, F.b);
  doc.setFontSize(11);
  doc.setTextColor(255);
  doc.text(label.toUpperCase(), x + 4, y + 5.5);
  doc.setTextColor(0);
  return h;
}

function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h = 10
): void {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);
  doc.rect(x, y, w, h);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(9);
  doc.text(label + ':', x + 1.2, y + 3.5);
  doc.setFont(FM.h, F.n);

  const valTxt = String(v(value)).replace(/[\r\n]+/g, ' ');
  let fontSize = 10;
  doc.setFontSize(fontSize);
  let lines = doc.splitTextToSize(valTxt, w - 2.4);

  if (lines.length > 1 && h <= 11) {
    fontSize = 7.5;
    doc.setFontSize(fontSize);
    lines = doc.splitTextToSize(valTxt, w - 2.4);
  }

  let ty = y + 7.5;
  const lineSpacing = fontSize === 7.5 ? 3 : 3.5;

  for (let l of lines) {
    if (ty > y + h - 0.5) {
      if (lines.length > 1) doc.text('...', x + w - 4, ty - lineSpacing);
      break;
    }
    doc.text(l, x + 1.2, ty);
    ty += lineSpacing;
  }
}

export async function generateNotasEnfermeriaPdf(
  payload: TrasladoPdfPayload
): Promise<Buffer | null> {
  const data = payload.data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 10;
  const CW = PW - M * 2;
  let Y = M;

  const p = data.paciente;
  if (!p) return null;

  const chkPage = (h: number) => {
    if (Y + h > PH - M) {
      doc.addPage();
      Y = M;
      return true;
    }
    return false;
  };

  // 1. Encabezado
  Y += drawOfficialHeader(
    doc,
    M,
    Y,
    CW,
    'NOTAS DE ENFERMERIA',
    'ASI-FT-35',
    payload.clinica.contexto
  );
  Y += 4;

  // 2. Datos del Paciente
  Y += drawSectionHeader(doc, 'Datos del Paciente', M, Y, CW);
  const q3 = CW / 3;
  drawField(doc, 'ID', v(p.documento?.numero), M, Y, q3, 11);
  drawField(doc, 'NOMBRES', v(p.nombres), M + q3, Y, q3, 11);
  drawField(doc, 'APELLIDOS', v(p.apellidos), M + q3 * 2, Y, q3, 11);
  Y += 11;

  const q6 = CW / 6;
  const tramos = data.tramos ?? [];
  const primerTramo = tramos[0];
  const signosPrimerTramo = primerTramo?.signosVitales?.[0]?.item ?? {};
  const peso = signosPrimerTramo.peso?.cantidad ?? '';
  const talla = signosPrimerTramo.talla?.cantidad ?? '';

  drawField(doc, 'EDAD', v(p.edad), M, Y, q6, 11);
  drawField(doc, 'PESO', v(peso), M + q6, Y, q6, 11);
  drawField(doc, 'TALLA', v(talla), M + q6 * 2, Y, q6, 11);
  drawField(doc, 'AFILIACIÓN', v(p.afiliacionContrato?.nombre), M + q6 * 3, Y, CW - q6 * 3, 11);
  Y += 11 + 4;

  // 3. Registro de Actividades
  Y += drawSectionHeader(doc, 'REGISTRO DE ACTIVIDADES POR TURNOS', M, Y, CW);

  // Tabla Header
  const colW = [22, 20, CW - 82, 40]; // Fecha, Hora, Actividad, Responsable
  const labels = ['FECHA', 'HORA', 'ACTIVIDAD', 'RESPONSABLE'];

  doc.setFont(FM.h, F.b);
  doc.setFontSize(10);
  let curX = M;
  labels.forEach((lbl, i) => {
    doc.rect(curX, Y, colW[i], 8);
    doc.text(lbl, curX + colW[i] / 2, Y + 5.5, { align: 'center' });
    curX += colW[i];
  });
  Y += 8;

  // Consolidar todas las notas de todos los tramos
  const todasLasNotas: any[] = tramos.reduce((acc: any[], t: any) => acc.concat(t.notas || []), []);

  // Filtrar notas de enfermería usando TIPOS_EMPLEADO fuertemente tipado
  const notasEnf = todasLasNotas
    .filter(n => n?.usuario?.tipoEmpleadoCode === TIPOS_EMPLEADO.AUXILIAR.getCode())
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  doc.setFont(FM.h, F.n);
  doc.setFontSize(9);

  notasEnf.forEach((nota, idx) => {
    const txt = v(nota.nota);
    const lines = doc.splitTextToSize(txt, colW[2] - 4);
    const respName = v(nota.usuario?.nombre);
    const respLines = doc.splitTextToSize(respName, colW[3] - 4);

    const rowH = Math.max(8, lines.length * 5, respLines.length * 5);

    chkPage(rowH);

    if (idx % 2 === 1) {
      doc.setFillColor(245, 245, 245);
      doc.rect(M, Y, CW, rowH, 'F');
    }

    let rx = M;
    doc.rect(rx, Y, colW[0], rowH);
    doc.text(new Date(nota.fecha).toLocaleDateString(), rx + colW[0] / 2, Y + 5, {
      align: 'center',
    });
    rx += colW[0];

    doc.rect(rx, Y, colW[1], rowH);
    doc.text(
      new Date(nota.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rx + colW[1] / 2,
      Y + 5,
      { align: 'center' }
    );
    rx += colW[1];

    doc.rect(rx, Y, colW[2], rowH);
    doc.text(lines, rx + 2, Y + 5);
    rx += colW[2];

    doc.rect(rx, Y, colW[3], rowH);
    doc.text(respLines, rx + 2, Y + 5);

    Y += rowH;
  });

  // Espacio para Firma (Enfermería)
  chkPage(30);
  Y += 10;
  const sigW = 60;
  const sigX = M;

  const auxiliarAsignado = data.asignacionActual?.auxiliar;
  const firmaAuxiliar = getFirmaBufferFromCedula(auxiliarAsignado?.documento);

  if (firmaAuxiliar) {
    doc.addImage(
      firmaAuxiliar.buffer,
      firmaAuxiliar.ext,
      sigX + 5,
      Y + 1,
      sigW - 10,
      13,
      undefined,
      'FAST'
    );
  }

  doc.line(sigX, Y + 15, sigX + sigW, Y + 15);
  doc.setFont(FM.h, F.b);
  doc.setFontSize(9);
  doc.text('FIRMA AUXILIAR DE ENFERMERÍA', sigX, Y + 19);

  if (auxiliarAsignado) {
    doc.setFont(FM.h, F.n);
    doc.text(v(auxiliarAsignado.nombre).toUpperCase(), sigX, Y + 14);
  }

  // Si no hay notas, dibujar algunas filas vacías
  if (notasEnf.length === 0) {
    for (let i = 0; i < 5; i++) {
      let rx = M;
      colW.forEach(w => {
        doc.rect(rx, Y, w, 8);
        rx += w;
      });
      Y += 8;
    }
  }

  return Buffer.from(doc.output('arraybuffer'));
}
