import { FileExtensions } from '@common/domain/enums';
import * as puppeteer from 'puppeteer';
import { CustomExportColumn, EquipoExportRow } from './equipos';

export interface PdfTemplateConfig<T> {
  templatePath: string;
  data: T;
  images?: Record<string, string>;
  pdfOptions?: puppeteer.PDFOptions;
}

export interface ExcelExportConfig {
  titulo: string;
  fechaImpresion: string;
  columnas: CustomExportColumn[];
  rows: EquipoExportRow[];
  logo?: {
    buffer: Buffer;
    extension: FileExtensions.JPEG | FileExtensions.PNG;
  };
}
