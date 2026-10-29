import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip = require('jszip');
import { Actor, Auditoria, Entrega, HoraExtra, Revision } from '../domain/modelo';

const moneda = (n: number | null) =>
  n == null
    ? ''
    : new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 2,
      }).format(n);
const fecha = (s: string | null) =>
  s ? new Date(s).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Pendiente';
const seguro = (s: unknown) => String(s ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
const xml = (s: unknown) =>
  seguro(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
const letra = (i: number): string =>
  i < 26 ? String.fromCharCode(65 + i) : letra(Math.floor(i / 26) - 1) + letra(i % 26);
interface Hoja {
  nombre: string;
  encabezados: string[];
  filas: (string | number | null)[][];
  moneda?: number[];
}

export async function xlsxPre(hojas: Hoja[]): Promise<Buffer> {
  if (hojas.some(h => h.filas.length > 100000))
    throw new BadRequestException('El archivo supera 100000 filas. Reduce los filtros.');
  const zip = new JSZip(),
    pre = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  zip.file(
    '[Content_Types].xml',
    `${pre}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`
  );
  zip.file(
    '_rels/.rels',
    `${pre}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  );
  zip.file(
    'xl/workbook.xml',
    `${pre}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${hojas.map((h, i) => `<sheet name="${xml(h.nombre)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `${pre}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
  );
  zip.file(
    'xl/styles.xml',
    `${pre}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF07828C"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf xfId="0" fontId="1" fillId="2" borderId="0" applyAlignment="1"><alignment wrapText="1"/></xf><xf xfId="0" numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  );
  hojas.forEach((h, i) => {
    const filas = [h.encabezados, ...h.filas];
    const datos = filas
      .map(
        (f, r) =>
          `<row r="${r + 1}"${r === 0 ? ' ht="36" customHeight="1"' : ''}>${f.map((v, c) => (typeof v === 'number' && Number.isFinite(v) ? `<c r="${letra(c)}${r + 1}" s="${h.moneda?.includes(c) ? 2 : 0}"><v>${v}</v></c>` : `<c r="${letra(c)}${r + 1}" t="inlineStr" s="${r === 0 ? 1 : 0}"><is><t xml:space="preserve">${xml(v)}</t></is></c>`)).join('')}</row>`
      )
      .join('');
    zip.file(
      `xl/worksheets/sheet${i + 1}.xml`,
      `${pre}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${letra(h.encabezados.length - 1)}${filas.length}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="28"/><cols><col min="1" max="${h.encabezados.length}" width="25" customWidth="1"/></cols><sheetData>${datos}</sheetData><autoFilter ref="A1:${letra(h.encabezados.length - 1)}${filas.length}"/></worksheet>`
    );
  });
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

@Injectable()
export class DocumentosPre {
  private readonly vistas = new Map<
    string,
    { usuario: number; contexto: string; id: string; version: number; vence: number }
  >();
  autorizar(a: Actor, id: string, version: number): string {
    for (const [k, v] of this.vistas) if (v.vence <= Date.now()) this.vistas.delete(k);
    if (this.vistas.size >= 1000) this.vistas.delete(this.vistas.keys().next().value);
    const token = randomUUID();
    this.vistas.set(token, {
      usuario: a.id,
      contexto: a.contexto,
      id,
      version,
      vence: Date.now() + 15 * 60000,
    });
    return token;
  }
  comprobar(a: Actor, id: string, version: number, token: string) {
    const v = this.vistas.get(token);
    if (
      !v ||
      v.usuario !== a.id ||
      v.contexto !== a.contexto ||
      v.id !== id ||
      v.version !== version ||
      v.vence <= Date.now()
    )
      throw new ConflictException(
        'Vuelve a generar la vista previa de la versión actual antes de finalizar.'
      );
  }
  auditoria(revision: Revision, previa = false): Buffer {
    const r = revision.auditoria,
      p = r.paciente,
      doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    doc.setProperties({
      title: `Preauditoría ${p.ingreso} - revisión ${revision.numero}`,
      author: revision.responsable,
      creator: 'Eklipse GCM',
    });
    doc.setFontSize(18);
    doc.setTextColor(7, 130, 140);
    doc.text('EKLIPSE · PREAUDITORÍA', 12, 15);
    doc.setTextColor(30);
    doc.setFontSize(10);
    doc.text(
      `${previa ? 'VISTA PREVIA · ' : ''}Ingreso ${p.ingreso} · Revisión ${revision.numero} · ${p.centro}`,
      12,
      22
    );
    autoTable(doc, {
      startY: 27,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [7, 130, 140] },
      body: [
        [
          'Paciente',
          `${p.nombre} · ${p.tipoDocumento} ${p.documento}`,
          'Valor prefactura',
          moneda(r.valor),
        ],
        [
          'Ingreso / egreso',
          `${p.fechaIngreso || ''} / ${p.fechaEgreso || 'Sin egreso'}`,
          'Entidad',
          `${p.entidadCodigo} ${p.entidad}`,
        ],
        [
          'Recepción',
          fecha(r.recibido),
          'Finalización original',
          fecha(r.auditado || revision.fecha),
        ],
      ],
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [7, 130, 140] },
      head: [
        [
          '#',
          'Causal',
          'Descripción causal',
          'CUPS / servicio',
          'Valor unitario',
          'Cantidad',
          'Motivo',
          'Área',
          'Hallazgo',
          'Preglosa',
          'Por facturar',
        ],
      ],
      body: r.hallazgos.length
        ? r.hallazgos.map((h, i) => [
            i + 1,
            h.codigo,
            `${h.general}\n${h.especifica}`,
            `${h.servicioCodigo}\n${h.servicio}`,
            moneda(h.valorUnitario),
            h.cantidad ?? '',
            h.motivo,
            h.area,
            h.descripcion,
            moneda(h.preglosa),
            moneda(h.porFacturar),
          ])
        : [['', 'Sin hallazgos', '', '', '', '', '', '', '', '', '']],
      columnStyles: { 2: { cellWidth: 45 }, 3: { cellWidth: 55 }, 8: { cellWidth: 65 } },
      margin: { top: 12, bottom: 14, left: 12, right: 12 },
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 158 },
        2: { cellWidth: 40 },
        3: { cellWidth: 158 },
      },
      margin: { left: 12, right: 12, bottom: 14 },
      body: [
        [
          'Total preglosa',
          moneda(r.hallazgos.reduce((t, h) => t + (h.preglosa || 0), 0)),
          'Total por facturar',
          moneda(r.hallazgos.reduce((t, h) => t + (h.porFacturar || 0), 0)),
        ],
        ['Auditor', revision.responsable, 'Facturador', r.facturador || 'Sin registrar'],
        ['Notas', r.notas || 'Sin notas', 'Fecha de revisión', fecha(revision.fecha)],
      ],
    });
    this.pies(doc, `Ingreso ${p.ingreso} · Revisión ${revision.numero} · Hora de Colombia`);
    return Buffer.from(doc.output('arraybuffer'));
  }
  entrega(e: Entrega): Buffer {
    const doc = new jsPDF();
    doc.setProperties({ title: e.codigo, author: e.responsable, creator: 'Eklipse GCM' });
    doc.setFontSize(16);
    doc.text('Constancia de entrega a facturación', 12, 17);
    doc.setFontSize(10);
    doc.text(
      [
        e.codigo,
        `${fecha(e.fecha)} · ${e.responsable}`,
        `${e.items.length} ingresos · ${moneda(e.total)}`,
      ],
      12,
      25
    );
    autoTable(doc, {
      startY: 43,
      head: [['Ingreso', 'Centro', 'Valor', 'Auditor', 'Revisión']],
      body: e.items.map(i => [i.ingreso, i.centro, moneda(i.valor), i.auditor, i.revision]),
      styles: { fontSize: 8, overflow: 'linebreak' },
      headStyles: { fillColor: [7, 130, 140] },
      margin: { bottom: 30 },
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      body: [
        [
          'Registro de la entrega confirmada en Eklipse. No constituye firma ni acuse de recibo de facturación. Las correcciones posteriores no modifican esta constancia.',
        ],
      ],
      styles: { fontSize: 9 },
      theme: 'plain',
    });
    this.pies(doc, e.codigo);
    return Buffer.from(doc.output('arraybuffer'));
  }
  private pies(doc: jsPDF, texto: string) {
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(90);
      doc.text(
        `${texto} · Página ${i} de ${doc.getNumberOfPages()}`,
        12,
        doc.internal.pageSize.getHeight() - 7
      );
    }
  }
  excel(registros: Auditoria[]): Promise<Buffer> {
    const publicados = registros.map(r => r);
    if (publicados.reduce((t, r) => t + r.hallazgos.length, 0) > 100000)
      throw new BadRequestException('Hay más de 100000 hallazgos. Reduce los filtros.');
    return xlsxPre([
      {
        nombre: 'Ingresos',
        moneda: [6, 15, 16],
        encabezados: [
          'Ingreso',
          'Paciente',
          'Tipo documento',
          'Documento',
          'Centro',
          'Entidad',
          'Valor prefactura',
          'Estado',
          'Responsable',
          'Recepción Colombia',
          'Asignación Colombia',
          'Primera finalización Colombia',
          'Entrega Colombia',
          'Revisión',
          'Hallazgos',
          'Preglosa',
          'Por facturar',
          'Notas',
        ],
        filas: publicados.map(r => [
          r.paciente.ingreso,
          r.paciente.nombre,
          r.paciente.tipoDocumento,
          r.paciente.documento,
          r.paciente.centro,
          r.paciente.entidad,
          r.valor,
          r.estado,
          r.responsable,
          fecha(r.recibido),
          r.asignado ? fecha(r.asignado) : '',
          r.auditado ? fecha(r.auditado) : '',
          r.entregado ? fecha(r.entregado) : '',
          r.revision,
          r.hallazgos.length,
          r.hallazgos.reduce((t, h) => t + (h.preglosa || 0), 0),
          r.hallazgos.reduce((t, h) => t + (h.porFacturar || 0), 0),
          r.notas,
        ]),
      },
      {
        nombre: 'Hallazgos',
        moneda: [8, 14, 15],
        encabezados: [
          'Ingreso',
          'Paciente',
          'Centro',
          'Causal',
          'General',
          'Específica',
          'CUPS',
          'Servicio',
          'Valor unitario',
          'Cantidad',
          'Motivo',
          'Área',
          'Descripción',
          'Destino',
          'Preglosa',
          'Por facturar',
        ],
        filas: publicados.flatMap(r =>
          r.hallazgos.map(h => [
            r.paciente.ingreso,
            r.paciente.nombre,
            r.paciente.centro,
            h.codigo,
            h.general,
            h.especifica,
            h.servicioCodigo,
            h.servicio,
            h.valorUnitario,
            h.cantidad,
            h.motivo,
            h.area,
            h.descripcion,
            h.destino,
            h.preglosa,
            h.porFacturar,
          ])
        ),
      },
    ]);
  }
  excelHoras(registros: HoraExtra[]): Promise<Buffer> {
    return xlsxPre([
      {
        nombre: 'Horas extras',
        moneda: [5],
        encabezados: [
          'Fecha',
          'Inicio',
          'Fin',
          'Día siguiente',
          'Horas',
          'Valor estimado COP',
          'Reportado',
          'Nota',
          'Reglas',
        ],
        filas: registros.map(r => [
          r.fecha,
          r.inicio,
          r.fin,
          r.diaSiguiente ? 'Sí' : 'No',
          r.calculo.minutos / 60,
          r.calculo.valor,
          r.reportado ? 'Sí' : 'No',
          r.nota,
          r.calculo.regla,
        ]),
      },
      {
        nombre: 'Detalle cálculo',
        moneda: [8, 9],
        encabezados: [
          'Registro',
          'Fecha',
          'Minutos',
          'Nocturna',
          'Festivo',
          'Descanso',
          'Factor',
          'Divisor',
          'Salario base',
          'Valor COP',
        ],
        filas: registros.flatMap(r =>
          r.calculo.segmentos.map(s => [
            r.id,
            s.fecha,
            s.minutos,
            s.nocturna ? 'Sí' : 'No',
            s.festivo,
            s.descanso ? 'Sí' : 'No',
            s.factor,
            s.divisor,
            s.salario,
            s.valor,
          ])
        ),
      },
    ]);
  }
}
