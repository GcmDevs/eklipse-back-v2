import {
  BadRequestException,
  HttpException,
  Injectable,
  PayloadTooLargeException,
  RequestTimeoutException,
} from '@nestjs/common';
import { spawn } from 'node:child_process';
import { extraerPedidoDisfarma, HojaPedido } from '../domain/pedido-excel.extractor';
const limite = (key: string, fallback: number) => {
  const n = Number(process.env[key]);
  return Number.isInteger(n) && n > 0 ? Math.min(n, fallback) : fallback;
};
export const limiteExcelBytes = () => limite('INVIMA_EXCEL_MAX_BYTES', 10 * 1024 * 1024);
const WORKER = `
const ExcelJS=require(process.argv[1]);
(async()=>{const parts=[];for await(const chunk of process.stdin)parts.push(chunk);
const book=new ExcelJS.Workbook();await book.xlsx.load(Buffer.concat(parts));
if(book.worksheets.length>5)throw new Error('El Excel supera el límite de 5 hojas.');
const hojas=book.worksheets.map(s=>{if(s.rowCount>2000 || s.columnCount>50)throw new Error('El Excel supera el límite de filas o columnas.');const filas=[];s.eachRow({includeEmpty:false},r=>{const celdas=[];for(let i=1;i<=s.columnCount;i++){const c=r.getCell(i);const formula=c.type===ExcelJS.ValueType.Formula;const texto=c.isMerged && c.master.address!==c.address ? '' : formula ? String(c.value.formula || 'Fórmula') : c.text; if(texto.length>4000)throw new Error('Una celda supera los 4000 caracteres.');celdas.push({texto,formula,...(c.type===ExcelJS.ValueType.Number && !formula && texto!=='' ? {numero:c.value} : {})});}filas.push({numero:r.number,celdas});});return {nombre:s.name,filas};});
process.stdout.write(JSON.stringify({hojas}));
})().catch(e=>{process.stdout.write(JSON.stringify({error:e.message}));});
`;
@Injectable()
export class PedidoExcelService {
  private activos = 0;
  async extraer(data: Buffer) {
    if (!data?.length || data.subarray(0, 4).toString('hex') !== '504b0304')
      throw new BadRequestException('Seleccione un Excel Disfarma .xlsx válido.');
    if (data.length > limiteExcelBytes())
      throw new PayloadTooLargeException('El Excel supera 10 MB.');
    if (this.activos >= 2)
      throw new HttpException(
        'Hay dos pedidos procesándose. Intente de nuevo en unos segundos.',
        429
      );
    this.activos++;
    try {
      const hojas = await new Promise<HojaPedido[]>((resolve, reject) => {
        const worker = spawn(
          process.execPath,
          ['--max-old-space-size=256', '-e', WORKER, require.resolve('exceljs')],
          { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] }
        );
        let settled = false,
          bytes = 0;
        const parts: Buffer[] = [];
        const finish = (error?: Error, result?: HojaPedido[]) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (worker.exitCode === null) worker.kill();
          error ? reject(error) : resolve(result!);
        };
        const timer = setTimeout(
          () => finish(new RequestTimeoutException('El Excel superó el tiempo máximo de lectura.')),
          limite('INVIMA_EXCEL_TIMEOUT_MS', 30000)
        );
        worker.stdout.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > 8 * 1024 * 1024)
            return finish(
              new PayloadTooLargeException('El contenido del Excel supera el límite permitido.')
            );
          parts.push(chunk);
        });
        worker.once('error', () =>
          finish(new BadRequestException('No se pudo iniciar la lectura del Excel.'))
        );
        worker.once('close', code => {
          if (settled) return;
          try {
            if (code !== 0) throw new Error();
            const value = JSON.parse(Buffer.concat(parts).toString('utf8'));
            if (value.error) return finish(new BadRequestException(value.error));
            finish(undefined, value.hojas);
          } catch {
            finish(
              new BadRequestException(
                'No se pudo leer el Excel. Compruebe que sea .xlsx y que no esté dañado o protegido.'
              )
            );
          }
        });
        worker.stdin.on('error', () => {});
        worker.stdin.end(data);
      });
      let result;
      try {
        result = extraerPedidoDisfarma(hojas);
      } catch (e) {
        throw new BadRequestException(e.message);
      }
      if (result.renglones.length > limite('INVIMA_EXCEL_MAX_ROWS', 500))
        throw new PayloadTooLargeException('El pedido supera el límite de 500 productos.');
      return result;
    } finally {
      this.activos--;
    }
  }
}
