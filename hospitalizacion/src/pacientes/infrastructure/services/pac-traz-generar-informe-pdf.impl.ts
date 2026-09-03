import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PacientePreAltaOrm,
  PacTrazEncuestaOrm,
  PacTrazRespuestaOrm,
} from '../orm/pacientes-trazadores';

@Injectable()
export class PacTrazGenerarInformePdfImpl extends BaseSource {
  async execute(pacienteId: number, ingresoId: number): Promise<Buffer> {
    const encuesta = await this.conn
      .getRepository(PacTrazEncuestaOrm)
      .findOne({ where: { pacienteId, ingresoId }, relations: ['usuario'] });
    if (!encuesta) throw new Error('No existe una auditoría para el paciente seleccionado.');
    const [preAlta, respuestas] = await Promise.all([
      this.conn
        .getRepository(PacientePreAltaOrm)
        .findOne({ where: { pacienteId, ingresoId }, relations: ['paciente'] }),
      this.conn.getRepository(PacTrazRespuestaOrm).find({
        where: { encuestaId: encuesta.id },
        relations: ['pregunta'],
        order: { preguntaId: 'ASC' },
      }),
    ]);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const pw = doc.internal.pageSize.getWidth(),
      ph = doc.internal.pageSize.getHeight(),
      m = 12;
    const navy: [number, number, number] = [15, 60, 82],
      cyan: [number, number, number] = [14, 116, 144];
    const team = this.json<string[]>(encuesta.equipoAuditor, []),
      responsables = this.json<Record<string, string>>(encuesta.responsablesHallazgos, {});
    const applicable = respuestas.filter(r => r.respuesta !== null).length,
      complies = respuestas.filter(r => r.respuesta === true).length;
    const compliance = applicable ? (complies / applicable) * 100 : 0,
      target: [number, number, number] = compliance >= 95 ? [5, 120, 87] : [185, 28, 28];
    this.header(doc, pw, m, navy, cyan);
    this.card(
      doc,
      m,
      31,
      87,
      'PACIENTE',
      preAlta?.paciente?.nombreCompleto ?? `Paciente ${pacienteId}`,
      `Documento: ${preAlta?.paciente?.numeroDoc ?? 'Sin información'} | Ingreso: ${ingresoId}`,
      navy
    );
    this.card(
      doc,
      102,
      31,
      87,
      'EQUIPO AUDITOR',
      encuesta.auditorLider ?? 'Auditor líder sin definir',
      `Equipo: ${team.join(', ') || 'Sin integrantes definidos'}`,
      navy
    );
    this.card(
      doc,
      192,
      31,
      75,
      'CUMPLIMIENTO GLOBAL',
      `${compliance.toFixed(1)}%`,
      compliance >= 95 ? 'META CUMPLIDA - >= 95%' : 'META NO CUMPLIDA - < 95%',
      target
    );
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text('Resultados de la auditoría', m, 67);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `${complies} cumple | ${respuestas.filter(r => r.respuesta === false).length} no cumple | ${respuestas.filter(r => r.respuesta === null).length} no aplica`,
      m,
      72
    );
    autoTable(doc, {
      startY: 76,
      margin: { left: m, right: m, bottom: 15 },
      head: [['#', 'Variable evaluada', 'Resultado', 'Observación / hallazgo', 'Responsable']],
      body: respuestas.map(r => [
        String(r.preguntaId),
        r.pregunta?.descripcion ?? 'Variable sin descripción',
        this.resultado(r.respuesta),
        r.observacion ?? 'Sin observación',
        responsables[String(r.preguntaId)] ?? 'Sin asignar',
      ]),
      styles: { font: 'helvetica', fontSize: 7.2, cellPadding: 2.2, textColor: [30, 41, 59] },
      headStyles: { fillColor: navy, textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 75 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 94 },
        4: { cellWidth: 53 },
      },
      didParseCell: data => {
        if (data.section === 'body' && data.column.index === 2) {
          const v = String(data.cell.raw);
          data.cell.styles.textColor =
            v === 'Cumple' ? [5, 120, 87] : v === 'No cumple' ? [185, 28, 28] : [30, 41, 59];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: () => this.footer(doc, pw, ph, m, navy),
    });
    let y = (doc as any).lastAutoTable.finalY + 10;
    const notes = doc.splitTextToSize(
        encuesta.observacion ?? 'Sin observaciones generales registradas.',
        pw - m * 2 - 6
      ),
      h = Math.max(18, notes.length * 4 + 10);
    if (y + h > ph - 18) {
      doc.addPage();
      this.header(doc, pw, m, navy, cyan);
      y = 31;
    }
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(m, y, pw - m * 2, h, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...navy);
    doc.text('OBSERVACIONES GENERALES', m + 3, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(notes, m + 3, y + 12);
    this.footer(doc, pw, ph, m, navy);
    return Buffer.from(doc.output('arraybuffer'));
  }
  private header(
    doc: jsPDF,
    pw: number,
    m: number,
    navy: [number, number, number],
    cyan: [number, number, number]
  ) {
    doc.setFillColor(...navy);
    doc.rect(0, 0, pw, 23, 'F');
    doc.setFillColor(...cyan);
    doc.rect(0, 23, pw, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255);
    doc.text('INFORME DE AUDITORÍA', m, 11);
    doc.setFontSize(9);
    doc.text('Paciente trazador', m, 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, pw - m, 17, { align: 'right' });
  }
  private card(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    label: string,
    value: string,
    detail: string,
    color: [number, number, number]
  ) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, y, w, 26, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 4, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(...color);
    doc.text(doc.splitTextToSize(value, w - 8).slice(0, 2), x + 4, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(detail, w - 8).slice(0, 2), x + 4, y + 22);
  }
  private footer(doc: jsPDF, pw: number, ph: number, m: number, navy: [number, number, number]) {
    doc.setDrawColor(203, 213, 225);
    doc.line(m, ph - 10, pw - m, ph - 10);
    doc.setFontSize(6.8);
    doc.setTextColor(...navy);
    doc.text('Paciente trazador - Documento interno de auditoría', m, ph - 6);
    doc.text(`Página ${doc.getNumberOfPages()}`, pw - m, ph - 6, { align: 'right' });
  }
  private resultado(v: boolean | null) {
    return v === true ? 'Cumple' : v === false ? 'No cumple' : 'No aplica';
  }
  private json<T>(value: string, fallback: T): T {
    try {
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  }
}
