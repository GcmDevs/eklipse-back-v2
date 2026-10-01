import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PDF_RENDER_TIMEOUT_MS, PdfTemplateConfig } from 'apps/reports/domain/types';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PuppeteerPdfGenerator {
  constructor() {
    this.registerHelpers();
  }

  async generatePdfFromHtml<T>({
    templatePath,
    data,
    images,
    pdfOptions,
  }: PdfTemplateConfig<T>): Promise<Buffer> {
    if (!templatePath || !fs.existsSync(templatePath)) {
      throw new InternalServerErrorException(`No se encontró la plantilla PDF en: ${templatePath}`);
    }

    const source = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(source);
    const html = template({ ...data, images });

    let browser: puppeteer.Browser;
    try {
      browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `No se pudo iniciar el motor de PDF: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: PDF_RENDER_TIMEOUT_MS,
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
        timeout: PDF_RENDER_TIMEOUT_MS,
        ...pdfOptions,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('mark', (value: unknown) => (value ? 'X' : ''));

    Handlebars.registerHelper('markNo', (value: unknown) => (!value ? 'X' : ''));

    Handlebars.registerHelper('orDash', (value: unknown) =>
      value != null && value !== '' ? value : '—'
    );

    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    Handlebars.registerHelper(
      'rowBg',
      (aplica: boolean) =>
        new Handlebars.SafeString(aplica ? 'style="background-color:#e8f5e9"' : '')
    );
  }
}
