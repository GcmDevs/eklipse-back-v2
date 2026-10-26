import {
  BadRequestException,
  HttpException,
  Injectable,
  PayloadTooLargeException,
  RequestTimeoutException,
} from '@nestjs/common';
import { spawn } from 'node:child_process';
import { FacturaExtraida, PaginaTexto } from '../domain/factura.models';
import { extraerFactura } from '../domain/factura.extractor';

const limit = (name: string, fallback: number, max = fallback) => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? Math.min(value, max) : fallback;
};
export const limitePdfBytes = () => limit('INVIMA_PDF_MAX_BYTES', 10 * 1024 * 1024);

// Plain JS makes the same worker runnable from ts-node, Nest watch and compiled CommonJS.
const WORKER = `
const { PDFParse } = require(process.argv[1]);
(async () => {
  let parser, output;
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    parser = new PDFParse({ data: Buffer.concat(chunks) });
    const info = await parser.getInfo();
    if (info.total > Number(process.argv[2])) throw Object.assign(new Error('El PDF supera el límite de páginas.'), { code: 'PDF_LIMITE_PAGINAS' });
    const result = await parser.getText({ parseHyperlinks: false });
    if (result.text.length > 5000000) throw Object.assign(new Error('El texto del PDF supera el límite permitido.'), { code: 'PDF_LIMITE_TEXTO' });
    output = { pages: result.pages };
  } catch (error) {
    output = { error: { name: error.name, code: error.code, message: error.message } };
  } finally { if (parser) await parser.destroy(); }
  process.stdout.write(JSON.stringify(output));
})().catch(() => process.exit(1));
`;

@Injectable()
export class PdfExtractorService {
  private activos = 0;
  async extraer(data: Buffer): Promise<FacturaExtraida> {
    if (!data?.length || !data.subarray(0, 1024).includes(Buffer.from('%PDF-')))
      throw new BadRequestException({
        code: 'PDF_INVALIDO',
        message: 'Seleccione un archivo PDF válido.',
      });
    if (data.length > limitePdfBytes())
      throw new PayloadTooLargeException('El PDF supera el tamaño permitido.');
    if (this.activos >= 2)
      throw new HttpException('Hay otras facturas procesándose. Reintente en unos segundos.', 429);
    this.activos++;
    try {
      const pages = await new Promise<PaginaTexto[]>((resolve, reject) => {
        // A process isolates native canvas/pdfjs cleanup and can be killed safely on timeout.
        const worker = spawn(
          process.execPath,
          [
            '--max-old-space-size=256',
            '-e',
            WORKER,
            require.resolve('pdf-parse'),
            String(limit('INVIMA_PDF_MAX_PAGES', 50)),
          ],
          {
            windowsHide: true,
            stdio: ['pipe', 'pipe', 'ignore'],
          }
        );
        const chunks: Buffer[] = [];
        let bytes = 0;
        let settled = false;
        const finish = (error?: Error, result?: PaginaTexto[]) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (worker.exitCode === null) worker.kill();
          error ? reject(error) : resolve(result!);
        };
        const timer = setTimeout(
          () =>
            finish(
              new RequestTimeoutException({
                code: 'PDF_TIEMPO_AGOTADO',
                message: 'El PDF superó el tiempo máximo de extracción.',
              })
            ),
          limit('INVIMA_PDF_TIMEOUT_MS', 30000)
        );
        worker.stdout.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > 32 * 1024 * 1024)
            return finish(
              new PayloadTooLargeException('El texto del PDF supera el límite permitido.')
            );
          chunks.push(chunk);
        });
        worker.once('close', code => {
          if (settled) return;
          let message: any;
          try {
            if (code !== 0) throw new Error();
            message = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          } catch {
            return finish(new BadRequestException('La extracción del PDF se interrumpió.'));
          }
          if (!message.error) return finish(undefined, message.pages);
          const password = /password/i.test(message.error.name || '');
          finish(
            new BadRequestException({
              code: password ? 'PDF_PROTEGIDO' : message.error.code || 'PDF_DANADO',
              message: password
                ? 'El PDF está protegido con contraseña. Cargue una copia sin protección.'
                : message.error.code
                  ? message.error.message
                  : 'No se pudo leer el PDF. Compruebe que no esté dañado.',
            })
          );
        });
        worker.once('error', () => finish(new BadRequestException('No se pudo procesar el PDF.')));
        worker.stdin.on('error', () => {
          /* close/error handlers report an interrupted process */
        });
        worker.stdin.end(data);
      });
      if (!pages.some(p => p.text.trim()))
        throw new BadRequestException({
          code: 'PDF_SIN_TEXTO',
          message: 'El PDF no contiene texto extraíble. Los documentos escaneados requieren OCR.',
        });
      const result = extraerFactura(pages);
      if (result.renglones.length > limit('INVIMA_PDF_MAX_ROWS', 500))
        throw new PayloadTooLargeException('La factura supera el límite de renglones.');
      return result;
    } finally {
      this.activos--;
    }
  }
}
