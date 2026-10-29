import autoTable, { CellInput, Table } from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { CTC_FILE_LOCATIONS } from '@inn/lgc/ctc/application/constants';
import { ENVIRONMENTS } from '@inn/app.environments';
import type { DataInterfaceI } from './impl';

const MARGIN = 40;
const HEADER_HEIGHT = 104;
const FONT_SIZE = 8;
const TIME_ZONE = 'America/Bogota';
const TITLE = 'TRASLADO DE PRODUCTO DE CONSIGNACIÓN';
const numberFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type TableDocument = jsPDF & { lastAutoTable?: Table };

function text(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function field(content: string, bold = false): CellInput {
  return { content, styles: { fontStyle: bold ? 'bold' : 'normal' } };
}

function documentDate(value: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(value);
}

function currentDate(value: Date): string {
  const parts = new Intl.DateTimeFormat('es-CO', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(item => item.type === type)?.value ?? '';
  return `${part('weekday')}, ${part('day')} ${part('month')} ${part('year')}`;
}

/** Builds the transfer form independently of file storage. Coordinates are in points. */
export function createOrdenTrasladoDocument(payload: DataInterfaceI): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' }) as TableDocument;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const width = pageWidth - MARGIN * 2;
  const printedAt = currentDate(new Date());
  const proveedor = payload.proveedor;
  const currency = (value: number) => `$ ${numberFormatter.format(value)}`;
  const lastTableY = () => doc.lastAutoTable?.finalY ?? HEADER_HEIGHT;
  const headerPages = new Set<number>();

  doc.setProperties({ title: `${TITLE} N°${payload.consecutivo}`, subject: TITLE });

  function drawHeader() {
    const page = doc.getCurrentPageInfo().pageNumber;
    if (headerPages.has(page)) return;
    headerPages.add(page);
    doc.setTextColor(0);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(text(payload.clinica.nombre), MARGIN + 32, 23);
    doc.text(text(payload.clinica.nit.split('-')[0]), MARGIN + 32, 40);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text(`Fecha Actual : ${printedAt}`, pageWidth - MARGIN - 38, 37, { align: 'right' });
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text(TITLE, pageWidth / 2, 68, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(`N°${payload.consecutivo}`, pageWidth / 2, 94, { align: 'center' });
  }

  drawHeader();

  // Base columns let the supplier fields and warehouse rows share aligned borders.
  const supplierWidths = [58, 36, 36, 68, 68, 22, 68, 30, 30, 116];
  const span = (content: string, colSpan: number, bold = false): CellInput => ({
    content,
    colSpan,
    styles: { fontStyle: bold ? 'bold' : 'normal' },
  });

  autoTable(doc, {
    startY: HEADER_HEIGHT,
    margin: { left: MARGIN, right: MARGIN, top: HEADER_HEIGHT, bottom: MARGIN },
    theme: 'plain',
    tableWidth: width,
    styles: {
      font: 'times',
      fontSize: FONT_SIZE,
      cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 },
      minCellHeight: 15,
      textColor: 0,
      lineColor: 0,
      lineWidth: 0.6,
      valign: 'top',
      overflow: 'linebreak',
    },
    columnStyles: Object.fromEntries(supplierWidths.map((cellWidth, i) => [i, { cellWidth }])),
    willDrawPage: () => drawHeader(),
    body: [
      [
        span('PROVEEDOR:', 2, true),
        span(text(proveedor.nombre), 3),
        field('NIT:', true),
        field(text(proveedor.nit)),
        span('FECHA:', 2, true),
        field(documentDate(payload.fecha)),
      ],
      [
        span('CIUDAD:', 2, true),
        span(text(proveedor.ciudad), 5),
        span('ESTADO:', 2, true),
        field(text(payload.estado)),
      ],
      [
        span('DIRECCION:', 2, true),
        span(text(proveedor.direccion), 5),
        span('TELEFONO:', 2, true),
        field(text(proveedor.telefono)),
      ],
      [
        span('ALMACEN CONSIG.:', 2, true),
        field(text(payload.almacenConsignacion.codigo)),
        span(text(payload.almacenConsignacion.nombre), 7),
      ],
      [
        span('ALMACEN DESTINO:', 2, true),
        field(text(payload.almacenDestino.codigo)),
        span(text(payload.almacenDestino.nombre), 7),
      ],
    ],
  });

  autoTable(doc, {
    startY: lastTableY() + 6,
    margin: { top: HEADER_HEIGHT, bottom: MARGIN, left: MARGIN, right: MARGIN },
    tableWidth: width,
    theme: 'plain',
    styles: {
      font: 'times',
      fontSize: FONT_SIZE,
      textColor: 0,
      overflow: 'linebreak',
      cellPadding: { top: 6, bottom: 3, left: 1, right: 1 },
    },
    headStyles: {
      fontStyle: 'bold',
      halign: 'center',
      lineColor: 0,
      lineWidth: 0.6,
      cellPadding: 2,
      minCellHeight: 15,
    },
    columnStyles: {
      0: { cellWidth: width * 0.11 },
      1: { cellWidth: width * 0.39 },
      2: { cellWidth: width * 0.12, halign: 'right' },
      3: { cellWidth: width * 0.17, halign: 'right' },
      4: { cellWidth: width * 0.21, halign: 'right' },
    },
    head: [['CODIGO', 'NOMBRE', 'CANTIDAD', 'VALOR/U', 'SUBTOTAL']],
    body: payload.detalle.map(producto => [
      text(producto.codigo),
      text(producto.nombre),
      numberFormatter.format(producto.cantidad),
      currency(producto.valorUnitario),
      currency(producto.valorSubtotal),
    ]),
    rowPageBreak: 'avoid',
    willDrawPage: data => {
      if (data.pageNumber > 1) drawHeader();
    },
  });

  autoTable(doc, {
    startY: lastTableY() + 2,
    margin: { top: HEADER_HEIGHT, bottom: MARGIN, left: MARGIN, right: MARGIN },
    theme: 'plain',
    tableWidth: width,
    styles: {
      font: 'times',
      fontSize: FONT_SIZE,
      fontStyle: 'normal',
      textColor: 0,
      halign: 'right',
      lineColor: 0,
      lineWidth: 0.6,
      cellPadding: 2,
      minCellHeight: 15,
    },
    columnStyles: { 0: { cellWidth: width * 0.79 }, 1: { cellWidth: width * 0.21 } },
    body: [
      [
        'TOTAL:',
        numberFormatter.format(payload.detalle.reduce((sum, item) => sum + item.valorSubtotal, 0)),
      ],
    ],
    willDrawPage: () => drawHeader(),
  });

  const description = text(payload.descripcion);
  if (description) {
    const detailX = MARGIN + 12;
    const lineHeight = 9;
    let y = lastTableY() + 18;
    doc.setFont('times', 'normal');
    doc.setFontSize(FONT_SIZE);
    const lines: string[] = doc.splitTextToSize(description, Math.min(380, width - 24));

    function drawDetailTitle() {
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.text('DETALLE', detailX, y);
      y += 12;
      doc.setFont('times', 'normal');
      doc.setFontSize(FONT_SIZE);
    }

    function nextDetailPage() {
      doc.addPage();
      drawHeader();
      y = HEADER_HEIGHT + 10;
      drawDetailTitle();
    }

    if (y + 12 + lineHeight > pageHeight - MARGIN) nextDetailPage();
    else drawDetailTitle();
    for (const line of lines) {
      if (y > pageHeight - MARGIN) nextDetailPage();
      doc.text(line, detailX, y);
      y += lineHeight;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`${page}/${pages}`, pageWidth - MARGIN - 38, 50, { align: 'right' });
  }
  return doc;
}

export async function generateOrdenTraslado(payload: DataInterfaceI): Promise<string> {
  const doc = createOrdenTrasladoDocument(payload);
  const directory = join('..', CTC_FILE_LOCATIONS.ordenesTraslado);
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, `${payload.consecutivo}.pdf`),
    Buffer.from(doc.output('arraybuffer'))
  );
  return `${ENVIRONMENTS.apiUrl}/${CTC_FILE_LOCATIONS.ordenesTraslado}/${payload.consecutivo}.pdf`;
}
