import { UserOptions } from 'jspdf-autotable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FILE_LOCATIONS } from '@common/application/constants';
import * as fs from 'fs';
import { ENVIRONMENTS } from 'src/app.environments';
import { additionalDataByCentro, GcmContextType } from '@common/domain/types';
import { Query1Res } from '../queries';
import { findImageFromContext, GcmGrouped } from '@common/application/services';
import { TimerService } from '@common/infrastructure/services';

const line = `_________________________________________________________________________________________________________________________________________`;
const timer = new TimerService();

export interface OCProducto {
  id: number;
  codigo: string;
  nombre: string;
  marca: string;
  cantidad: number;
  unidadMedida: string;
  valorUnitario: number;
  porcDescuento: number;
  porcIVA: number;
}

export interface OCPayload {
  contexto: GcmContextType;
  centroId: number;
  items: GcmGrouped<Query1Res>[];
  cantidadPacientes: number;
  isResumen: boolean;
}

interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

const BE_EPDF_FONT_SIZES = {
  _18: 18,
  _16: 16,
  _14: 14,
  _12: 12,
  _11: 11,
  _10: 10,
  _9: 9,
  _8: 8,
  _7: 7,
  _6: 6,
};

const BE_EPDF_LINE_COLORS = {
  default: 'rgb(233, 233, 233)',
};

const BE_EPDF_FONT_FAMILIES = {
  default: 'helvetica',
};

export async function generatePdf1(payload: OCPayload) {
  let startX = 40,
    startY = 40,
    rowsHeight = 24;

  const addDtByCtx = additionalDataByCentro(payload.contexto, undefined, payload.centroId);

  const doc = new jsPDF('l', 'pt') as jsPDFWithPlugin;
  const maxPageHeight = 811.89;

  const heightImage = 45;
  const img: any = fs.readFileSync(findImageFromContext(payload.contexto, payload.centroId));

  doc.addImage(img, 'jpg', startX, startY, 140, heightImage);

  doc.setFontSize(BE_EPDF_FONT_SIZES._18);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`CENSO HOSPITALARIO :: SEDE ${addDtByCtx.alias1}`, startX + 400, startY + 15, {
    maxWidth: 600,
    align: 'center',
  });

  doc.setFontSize(BE_EPDF_FONT_SIZES._10);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${timer.formatDate(new Date(), 4)}`, startX + 400, startY + 30, {
    maxWidth: 600,
    align: 'center',
  });

  startY += heightImage + 20;

  function addPage(ignoreConditions = false) {
    if (startY > maxPageHeight && !ignoreConditions) {
      doc.addPage();
      startY = 40;
    }

    if (ignoreConditions) {
      doc.addPage();
      startY = 40;
    }
  }

  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

  const addToStartY = 12;

  const tablas = [
    'Plan Beneficio',
    'Identificación',
    'Nombre del Paciente',
    'Edad',
    'Sexo',
    'Días',
    'Unidad funcional',
  ];

  payload.items.forEach((p, i) => {
    if (i) doc.text(line, startX, startY - 18);

    doc.setFontSize(BE_EPDF_FONT_SIZES._10);
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');

    const nombreEntidadHeight = doc.getTextDimensions(`${p.key}`, {
      maxWidth: 360,
    }).h;

    doc.setTextColor('#4A4A4A');
    doc.text(p.key, startX, startY, { maxWidth: 360 });
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
    doc.text(`Cantidad pacientes:`, startX + 400, startY);
    doc.text(`${p.rows.length} de ${payload.cantidadPacientes}`, startX + 500, startY);
    doc.text(`Porc. respecto a la ocupacion:`, startX + 560, startY);
    doc.text(
      `${((p.rows.length * 100) / payload.cantidadPacientes).toFixed(2)}%`,
      startX + 710,
      startY
    );
    doc.setTextColor('#000000');

    startY += nombreEntidadHeight;

    const tablaProductos = p.rows.map(res => {
      const response = [
        res.ENTIDAD,
        res.IDENTIFICACION,
        res.NOMBRE_PACIENTE,
        res.EDAD,
        res.SEXO,
        res.DIAS,
        res.HSUNOMBRE,
      ];

      return response;
    });

    if (!payload.isResumen) {
      doc.autoTable({
        head: [tablas],
        body: tablaProductos,
        didDrawPage: d => {
          rowsHeight = d.cursor?.y || 0;
        },
        startY,
        theme: 'grid',
        headStyles: {
          lineColor: '#000000ff',
          cellPadding: 2,
          lineWidth: 0.5,
          fontSize: BE_EPDF_FONT_SIZES._8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          lineColor: '#ffffff',
          cellPadding: 2,
          fontSize: BE_EPDF_FONT_SIZES._7,
        },
        styles: { fillColor: 'white', textColor: 'black', lineColor: BE_EPDF_LINE_COLORS.default },
      });
      startY = rowsHeight + 15;

      doc.setFontSize(BE_EPDF_FONT_SIZES._10);
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text('Total Pacientes Hospitalizados:', startX, startY);
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`${p.key}`, startX + 160, startY);
      doc.text(`${p.rows.length}`, startX + 600, startY);
      startY += addToStartY;

      startY += 10;
    } else {
      startY += 20;
    }

    if (startY >= 600.3) addPage(true);
  });

  startY += addToStartY + 30;
  startX += 70;

  if (startY >= 600.3) addPage(true);
  else startY += 40;

  startX = 30;

  startY += 12;

  // Paginación
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.setFontSize(BE_EPDF_FONT_SIZES._8);

  const pages = doc.internal.pages.length - 1;

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.text(`${i}/${pages}`, pageWidth - 60, 30);
  }

  fs.mkdir(`../${FILE_LOCATIONS.gen.pdfs}`, _err => {});

  let name = `CENSO_HOSPITALARIO_${addDtByCtx.abreviattion}.pdf`;

  if (payload.isResumen) name = `CENSO_HOSPITALARIO_RESUMIDO_${addDtByCtx.abreviattion}.pdf`;

  const url = `../${FILE_LOCATIONS.gen.pdfs}/${name}`;

  doc.save(url);

  return `${ENVIRONMENTS.apiUrl}/${url.slice(3)}`;
}
