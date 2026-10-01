import { Injectable } from '@nestjs/common';
import { EQUIPOS_INVENTARIO_COLUMNS, InventarioExportRow } from 'apps/reports/domain/types';
import * as ExcelJS from 'exceljs';
import * as path from 'path';

@Injectable()
export class ExceljsInventarioExportGenerator {
  private readonly dataStartRow = 9;
  private readonly templatePath = path.join(
    process.cwd(),
    'apps/reports/infrastructure/exporters/excel/templates/report-inventario.template.xlsx'
  );

  public async generate(config: {
    fechaGeneracion: string;
    rows: InventarioExportRow[];
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.templatePath);
    const sheet = workbook.getWorksheet('BIO-FT-96');

    sheet.getCell('C7').value = 'ALTA COMPLEJIDAD DEL CARIBE';
    sheet.getCell('H7').value = config.fechaGeneracion;

    config.rows.forEach((row, i) => {
      const excelRow = sheet.getRow(this.dataStartRow + i);
      EQUIPOS_INVENTARIO_COLUMNS.forEach((col, colIndex) => {
        const cell = excelRow.getCell(colIndex + 2);
        cell.value = row[col] ?? '';
        if (this.dataStartRow + i > 112) {
          cell.border = sheet.getRow(112).getCell(colIndex + 2).border;
          cell.font = sheet.getRow(112).getCell(colIndex + 2).font;
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
