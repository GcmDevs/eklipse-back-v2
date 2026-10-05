import { Injectable } from '@nestjs/common';
import {
  ExcelExportConfig,
  CustomExportColumn,
  EQUIPOS_EXPORT_COLUMN_LABELS,
  EquipoExportRow,
  REPORT_EXCEL_COLUMN_HEADER_BG,
  REPORT_EXCEL_COLUMN_HEADER_FG,
} from 'apps/reports/domain/types';
import * as ExcelJS from 'exceljs';

const BLACK = 'FF000000';

@Injectable()
export class ExceljsEquiposCustomExportGenerator {
  private readonly logoAreaRows = 4;
  private readonly spacerRow = 5;
  private readonly dataHeaderRow = 6;

  public async generate(config: ExcelExportConfig): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Eklipse GCM';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Equipos', {
      views: [{ state: 'frozen', ySplit: this.dataHeaderRow }],
    });

    this.buildEncabezado(sheet, config);
    this.buildColumnHeaders(sheet, config.columnas);
    this.buildDataRows(sheet, config.columnas, config.rows);
    this.applyOuterBlackBorder(
      sheet,
      this.dataHeaderRow,
      this.dataHeaderRow + config.rows.length,
      config.columnas.length
    );
    this.autosizeColumns(sheet, config.columnas.length);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private buildEncabezado(sheet: ExcelJS.Worksheet, config: ExcelExportConfig): void {
    const colSpan = Math.max(config.columnas.length, 1);

    for (let row = 1; row <= this.logoAreaRows; row++) {
      sheet.getRow(row).height = 18;
    }
    sheet.getRow(this.spacerRow).height = 10;

    if (config.logo?.buffer?.length) {
      const imageId = sheet.workbook.addImage({
        buffer: config.logo.buffer as any,
        extension: config.logo.extension,
      });
      sheet.addImage(imageId, {
        tl: { col: 0.05, row: 0.1 },
        ext: { width: 200, height: 72 },
        editAs: 'oneCell',
      });
    }

    const fechaCell = sheet.getCell(1, colSpan);
    fechaCell.value = `fecha de impresion: ${config.fechaImpresion}`;
    fechaCell.font = {
      name: 'Arial',
      size: 9,
      color: { argb: 'FFB5B5B5' },
    };
    fechaCell.alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
  }

  private buildColumnHeaders(sheet: ExcelJS.Worksheet, columnas: CustomExportColumn[]): void {
    const headerRow = sheet.getRow(this.dataHeaderRow);
    headerRow.height = 22;

    columnas.forEach((columna, index) => {
      const col = index + 1;
      const cell = headerRow.getCell(col);
      cell.value = EQUIPOS_EXPORT_COLUMN_LABELS[columna];
      cell.font = {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: `FF${REPORT_EXCEL_COLUMN_HEADER_FG}` },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${REPORT_EXCEL_COLUMN_HEADER_BG}` },
      };
      cell.border = this.innerBlackBorder();
    });
  }

  private buildDataRows(
    sheet: ExcelJS.Worksheet,
    columnas: CustomExportColumn[],
    rows: EquipoExportRow[]
  ): void {
    rows.forEach((row, rowIndex) => {
      const excelRow = sheet.getRow(this.dataHeaderRow + 1 + rowIndex);
      columnas.forEach((columna, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = row[columna] ?? '';
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true,
        };
        cell.border = this.innerBlackBorder();
      });
    });
  }

  private applyOuterBlackBorder(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    endRow: number,
    columnCount: number
  ): void {
    if (columnCount < 1 || endRow < startRow) {
      return;
    }

    const medium: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: BLACK } };

    for (let col = 1; col <= columnCount; col++) {
      const topCell = sheet.getCell(startRow, col);
      topCell.border = { ...topCell.border, top: medium };

      const bottomCell = sheet.getCell(endRow, col);
      bottomCell.border = { ...bottomCell.border, bottom: medium };
    }

    for (let row = startRow; row <= endRow; row++) {
      const leftCell = sheet.getCell(row, 1);
      leftCell.border = { ...leftCell.border, left: medium };

      const rightCell = sheet.getCell(row, columnCount);
      rightCell.border = { ...rightCell.border, right: medium };
    }
  }

  private innerBlackBorder(): Partial<ExcelJS.Borders> {
    const thin: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BLACK } };
    return { top: thin, left: thin, bottom: thin, right: thin };
  }

  private autosizeColumns(sheet: ExcelJS.Worksheet, columnCount: number): void {
    for (let i = 1; i <= columnCount; i++) {
      const column = sheet.getColumn(i);
      let max = 12;
      column.eachCell({ includeEmpty: true }, cell => {
        const length = cell.value == null ? 0 : String(cell.value).length;
        if (length > max) {
          max = length;
        }
      });
      column.width = Math.min(Math.max(max + 2, 12), 42);
    }
  }
}
