import { UserOptions } from 'jspdf-autotable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import * as fs from 'fs';
import { ENVIRONMENTS } from 'src/app.environments';
import { additionalDataByCentro, GcmContextType } from '@common/domain/types';
import { Query2Res } from '../queries';
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
  items: {
    key: string;
    name: string;
    groups: GcmGrouped<Query2Res>[];
    cantidad: number;
    cantidadOcupadas: number;
  }[];
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

export async function generatePdf2(payload: OCPayload) {
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
    'Cama',
    'Ingreso',
    'Fecha',
    'Identificación',
    'Nombre del Paciente',
    'Edad',
    'Sexo',
    'Días',
    'Entidad',
  ];

  payload.items.forEach(g => {
    if (g.cantidadOcupadas) {
      doc.setTextColor('#4A4A4A');
      doc.setFontSize(BE_EPDF_FONT_SIZES._12);
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(g.key, startX, startY);
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`Cantidad Ocupadas:`, startX + 340, startY);
      doc.text(`${g.cantidadOcupadas} de ${g.cantidad}`, startX + 460, startY);
      doc.text(`Porcentaje Ocupacion:`, startX + 530, startY);
      doc.text(`${((g.cantidadOcupadas * 100) / g.cantidad).toFixed(2)}%`, startX + 710, startY);
      doc.setTextColor('#000000');
      startY += 15;
      if (payload.isResumen) doc.text(line, startX, startY - 14);

      doc.setFontSize(BE_EPDF_FONT_SIZES._10);

      g.groups.forEach((p, i) => {
        if (i && !payload.isResumen) doc.text(line, startX, startY - 18);

        const tablaProductos = p.rows
          .filter(r => r.INGRESO)
          .map(res => {
            const response = [
              res.CAMA,
              res.INGRESO,
              timer.formatDate(res.FECHA, 5),
              res.IDENTIFICACION,
              res.NOMBRE_PACIENTE,
              res.EDAD,
              res.SEXO,
              res.DIAS,
              res.ENTIDAD,
            ];

            return response;
          });

        if (tablaProductos.length) {
          const nombreEntidadHeight = doc.getTextDimensions(`${p.key}`, {
            maxWidth: 310,
          }).h;

          doc.setTextColor('#4A4A4A');
          doc.text(p.key, startX, startY, { maxWidth: 310 });

          const cantPacSubgr = p.rows.length;
          const cantPacSubgrOcup = p.rows.filter(rc => rc.INGRESO).length;

          doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
          doc.text(`Cantidad de camas Ocupadas:`, startX + 350, startY);
          doc.text(`${cantPacSubgrOcup} de ${cantPacSubgr}`, startX + 500, startY);
          doc.text(`Porcentaje de Ocupacion:`, startX + 560, startY);
          doc.text(
            `${((cantPacSubgrOcup * 100) / cantPacSubgr).toFixed(2)}%`,
            startX + 710,
            startY
          );
          doc.setTextColor('#000000');

          startY += nombreEntidadHeight;

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
              styles: {
                fillColor: 'white',
                textColor: 'black',
                lineColor: BE_EPDF_LINE_COLORS.default,
              },
            });

            startY = rowsHeight + 15;
          }
        }

        startY += 10;

        if (startY >= 550.3) addPage(true);
      });
    }
  });

  startY += addToStartY + 30;
  startX += 70;

  if (startY >= 550.3) addPage(true);
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

  let name = `CENSO_HOSPITALARIO_BY_GRUPO_${addDtByCtx.abreviattion}.pdf`;

  if (payload.isResumen) name = `CENSO_HOSPITALARIO_BY_GRUP_RESUMID_${addDtByCtx.abreviattion}.pdf`;

  const url = `../${FILE_LOCATIONS.gen.pdfs}/${name}`;

  doc.save(url);

  return `${ENVIRONMENTS.apiUrl}/${url.slice(3)}`;
}
