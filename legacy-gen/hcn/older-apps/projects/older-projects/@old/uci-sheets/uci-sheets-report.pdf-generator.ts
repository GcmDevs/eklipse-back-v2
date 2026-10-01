import autoTable, { UserOptions } from 'jspdf-autotable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ReporteDpSabanaUciDto } from './uci-sheets-report.dtos';
import * as fs from 'fs';

interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

export const BE_EPDF_FONT_SIZES = {
  headTitleFontSize: 18,
  head2TitleFontSize: 16,
  titleFontSize: 14,
  subTitleFontSize: 12,
  normalFontSize: 10,
  tableFontSize: 9,
  smallFontSize: 8,
};

export const BE_EPDF_LINE_COLORS = {
  default: 'rgb(233, 233, 233)',
};

export const BE_EPDF_FONT_FAMILIES = {
  default: 'helvetica',
};

export const BE_EPDF_HORAS = [
  '7:00',
  '8:00',
  '9:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
  '0:00',
  '1:00',
  '2:00',
  '3:00',
  '4:00',
  '5:00',
  '6:00',
];

export async function generateReporteSabanasUciPDF(
  sabanasUci: ReporteDpSabanaUciDto,
  marcaAgua: string
) {
  // const start = performance.now();

  let img: any = fs.readFileSync(`${marcaAgua}`);
  img.src = marcaAgua;

  const doc = new jsPDF('l', 'pt') as jsPDFWithPlugin;

  const startX = 40;
  let startY = 24;

  let rowsHeight = 24;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.setFontSize(BE_EPDF_FONT_SIZES.titleFontSize);

  doc.addImage(img, 'jpg', startX, startY, 160, 60);
  doc.text('REPORTE DE SABANAS UCI', 300, 60);
  startY += 85;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.setFontSize(BE_EPDF_FONT_SIZES.normalFontSize);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Fecha de ingreso: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${sabanasUci.informacionIngreso.fechaRegistroFt}`, startX + 90, startY);
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Ingreso: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${sabanasUci.informacionIngreso.ingreso.consecutivo}`, startX + 44, startY);
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Identificación: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${sabanasUci.informacionIngreso.paciente.documento.numero}`, startX + 70, startY);
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Paciente: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${sabanasUci.informacionIngreso.paciente.nombreCompleto}`, startX + 49, startY);
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Eps: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${sabanasUci.informacionIngreso.entidad.nombre}`, startX + 24, startY);
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Cama: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`UNIDAD DE CUIDADOS INTENSIVOS`, startX + 32, startY);
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Peso: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `${(sabanasUci.informacionIngreso.paciente.peso || 0).toFixed(2)} KL(S)`,
    startX + 28,
    startY
  );
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Balance acumulado: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${(sabanasUci.balanceLiquidos.acumulado || 0).toFixed(2)}`, startX + 100, startY);
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Liquidos administrados: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `${(sabanasUci.balanceLiquidos.liquidosAdministrados || 0).toFixed(2)}`,
    startX + 120,
    startY
  );
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Liquidos Eliminados: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `${(sabanasUci.balanceLiquidos.liquidosEliminados || 0).toFixed(2)}`,
    startX + 105,
    startY
  );
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Gasto urinario: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${(sabanasUci.balanceLiquidos.gastoUrinario || 0).toFixed(2)}`, startX + 76, startY);
  startY += 12;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Perdida insensible: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `${(sabanasUci.balanceLiquidos.perdidaInsensible || 0).toFixed(2)}`,
    startX + 94,
    startY
  );
  startY += 25;

  /*******************************************************/
  /****************** GLUCOMETRIAS ***************************/
  /*******************************************************/
  doc.setFontSize(BE_EPDF_FONT_SIZES.titleFontSize);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  if (sabanasUci.glucometrias.length) doc.text('Glucometrías', startX, startY);
  //doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  if (sabanasUci.glucometrias.length) doc.line(startX, startY + 5, 800, startY + 5);

  startY += 9;

  autoTable(doc, {
    head: [BE_EPDF_HORAS],
    body: [sabanasUci.glucometrias.map(_ => _.resultado || 0)],
    didDrawPage: d => {
      rowsHeight = d.cursor?.y || 0;
    },
    startY,
    theme: 'grid',
    headStyles: {
      lineColor: BE_EPDF_LINE_COLORS.default,
      cellPadding: 2,
      lineWidth: 0.5,
      fontSize: BE_EPDF_FONT_SIZES.tableFontSize,
      fontStyle: 'normal',
    },
    bodyStyles: {
      lineColor: BE_EPDF_LINE_COLORS.default,
      cellPadding: 1,
      fontSize: BE_EPDF_FONT_SIZES.tableFontSize,
    },
    styles: { fillColor: 'white', textColor: 'black', lineColor: BE_EPDF_LINE_COLORS.default },
  });
  /*******************************************************/
  /****************** SIGNOS VITALES *********************/
  /*******************************************************/
  startY = rowsHeight;
  startY += 15;
  //doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  if (sabanasUci.signos.length) doc.text('Signos Vitales', startX, startY);
  //doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.setFontSize(BE_EPDF_FONT_SIZES.normalFontSize);
  if (sabanasUci.signos.length) doc.line(startX, startY + 5, 800, startY + 5);

  sabanasUci.signos.forEach((signo, i) => {
    startY = rowsHeight;
    startY += 13;
    if (!i) startY += 18;
    doc.text(signo.signo, startX, startY);
    startY += 4;

    autoTable(doc, {
      head: [BE_EPDF_HORAS],
      body: [signo.resultados.map(_ => _.valor)],
      didDrawPage: d => {
        rowsHeight = d.cursor?.y || 0;
      },
      startY,
      theme: 'grid',
      headStyles: {
        lineColor: BE_EPDF_LINE_COLORS.default,
        cellPadding: 2,
        lineWidth: 0.5,
        fontSize: BE_EPDF_FONT_SIZES.tableFontSize,
        fontStyle: 'normal',
      },
      bodyStyles: {
        lineColor: BE_EPDF_LINE_COLORS.default,
        cellPadding: 1,
        fontSize: BE_EPDF_FONT_SIZES.tableFontSize,
      },
      styles: { fillColor: 'white', textColor: 'black', lineColor: BE_EPDF_LINE_COLORS.default },
    });
  });
  /*******************************************************/
  /****************** LIQUIDOS ***************************/
  /*******************************************************/
  startY = rowsHeight;
  startY += 15;
  doc.setFontSize(BE_EPDF_FONT_SIZES.titleFontSize);
  //doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  if (sabanasUci.liquidos.length) doc.text('Balance de liquidos', startX, startY);
  //doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.setFontSize(BE_EPDF_FONT_SIZES.normalFontSize);
  if (sabanasUci.liquidos.length) doc.line(startX, startY + 5, 800, startY + 5);

  sabanasUci.liquidos.forEach((liquido, i) => {
    startY = rowsHeight;
    startY += 13;
    if (!i) startY += 18;
    doc.text(liquido.liquido, startX, startY);
    startY += 5;

    autoTable(doc, {
      head: [BE_EPDF_HORAS],
      body: [liquido.resultados.map(_ => _.valor)],
      didDrawPage: d => {
        rowsHeight = d.cursor?.y || 0;
      },
      startY,
      theme: 'grid',
      headStyles: {
        lineColor: BE_EPDF_LINE_COLORS.default,
        cellPadding: 2,
        lineWidth: 0.5,
        fontSize: BE_EPDF_FONT_SIZES.tableFontSize,
        fontStyle: 'normal',
      },
      bodyStyles: {
        lineColor: BE_EPDF_LINE_COLORS.default,
        cellPadding: 1,
        fontSize: BE_EPDF_FONT_SIZES.tableFontSize,
      },
      styles: { fillColor: 'white', textColor: 'black', lineColor: BE_EPDF_LINE_COLORS.default },
    });
  });

  //const time: number = performance.now() - start;
  //console.log(`pdf generado en ${time.toFixed()} ms`);
  return doc.output('arraybuffer');
}
