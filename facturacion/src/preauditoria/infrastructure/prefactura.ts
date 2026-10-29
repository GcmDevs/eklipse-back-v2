import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { ChildProcess, spawn } from 'node:child_process';
import { Actor, PacienteIngreso } from '../domain/modelo';

export const MAX_PDF_PRE = 20 * 1024 * 1024;
export function importeColombiano(s: string): number | null {
  let v = s.replace(/[$\s\u00a0]/g, '');
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(v)) v = v.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(v)) v = v.replace(/,/g, '');
  else if (/^\d+(,\d{1,2})?$/.test(v)) v = v.replace(',', '.');
  else if (!/^\d+\.\d{1,2}$/.test(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1e12 ? n : null;
}
const canonical = (s: string) => s.replace(/^0+(?=\d)/, '');
export function leerPrefactura(texto: string, paciente: PacienteIngreso) {
  if (texto.replace(/\s/g, '').length < 30)
    throw new BadRequestException(
      'El PDF no contiene texto digital suficiente. Adjunta el PDF descargado de Dinámica, sin escanear.'
    );
  const netos = new Set<number>(),
    ingresos = new Set<string>(),
    documentos = new Set<string>();
  const neto =
    /(?:valor\s+neto(?:\s+a\s+pagar)?|total\s+neto(?:\s+a\s+pagar)?|neto\s+a\s+pagar|total\s+(?:de\s+la\s+)?pre[ -]?factura|(?:valor\s+)?total\s+a\s+pagar)\s*[:=]?\s*(?:COP\s*)?\$?\s*([\d][\d.,\u00a0 ]*\d|\d)/gi;
  for (const match of texto.matchAll(neto)) {
    const valor = importeColombiano(match[1].trim());
    if (valor !== null) netos.add(valor);
  }
  for (const linea of texto.split(/[\r\n]+/)) {
    if (!/fecha\s+(?:de\s+)?ingreso/i.test(linea)) {
      const i = linea.match(
        /\bingreso\s*(?:(?:n[úu]mero|nro\.?|no\.?|n[°º])\s*)?[:#.-]?\s*(\d{1,20})(?!\d)/i
      );
      if (i) ingresos.add(canonical(i[1]));
    }
    // "Documento" solo también puede ser el consecutivo de la factura, no la identificación.
    const d =
      linea.match(
        /\bdocumento\s*[:#.-]?\s*(?:CC|CE|TI|RC|PA|PPT|PEP|PE)\s*[:#.-]?\s*([a-z0-9][a-z0-9.-]{2,39})/i
      ) ||
      linea.match(
        /\b(?:identificaci[oó]n|c[eé]dula|documento\s+(?:(?:del?\s+)?paciente|de\s+identidad))\s*(?:del\s+paciente\s*)?[:#.-]?\s*(?:(?:CC|CE|TI|RC|PA|PPT|PEP|PE)\s*[:#.-]?\s*)?([a-z0-9][a-z0-9.-]{2,39})/i
      );
    if (d && /\d/.test(d[1])) documentos.add(d[1].replace(/\./g, '').toUpperCase());
  }
  if (
    [...ingresos].some(i => i !== canonical(paciente.ingreso)) ||
    [...documentos].some(d => d !== paciente.documento.trim().replace(/\./g, '').toUpperCase())
  )
    throw new BadRequestException(
      'El ingreso o documento del PDF no coincide con el paciente consultado. Adjunta la prefactura correcta.'
    );
  const identidadCompleta = ingresos.size > 0 && documentos.size > 0;
  return {
    neto: netos.size === 1 ? [...netos][0] : null,
    candidatos: [...netos],
    identidadCompleta,
    incidencias: [
      ...(netos.size !== 1
        ? ['No se identificó un único neto. Indícalo manualmente y justifica la confirmación.']
        : []),
      ...(!identidadCompleta
        ? [
            'No se pudo verificar automáticamente toda la identidad. Comprueba paciente e ingreso en el PDF.',
          ]
        : []),
    ],
  };
}
export interface AnalisisPre {
  id: string;
  propietario: string;
  vence: number;
  paciente: PacienteIngreso;
  sha256: string;
  bytes: number;
  neto: number | null;
  candidatos: number[];
  identidadCompleta: boolean;
  incidencias: string[];
}
// Proceso aislado: un fallo nativo del lector no debe interrumpir el servidor HTTP.
// Tanto la entrada como la salida viajan por tuberías; nunca se escribe el PDF a disco.
const PARSER = `(async()=>{const chunks=[];for await(const c of process.stdin)chunks.push(c);
const {PDFParse}=require(process.argv[1]);const parser=new PDFParse({data:Uint8Array.from(Buffer.concat(chunks)),isEvalSupported:false});
try{const info=await parser.getInfo();if(info.total>500)throw Error('Más de 500 páginas');
const result=await parser.getText();if(result.text.length>2000000)throw Error('Texto demasiado extenso');
process.stdout.write(JSON.stringify({texto:result.text}));}finally{await parser.destroy()}})().catch(()=>process.stdout.write(JSON.stringify({error:true})));`;

@Injectable()
export class PrefacturasPre implements OnModuleDestroy {
  private readonly analisis = new Map<string, AnalisisPre>();
  private readonly workers = new Set<ChildProcess>();
  private readonly ocupados = new Set<string>();
  private readonly timer = setInterval(() => this.limpiar(), 60000);
  constructor() {
    this.timer.unref();
  }
  onModuleDestroy() {
    clearInterval(this.timer);
    for (const w of this.workers) w.kill();
    this.analisis.clear();
  }
  private propietario(a: Actor) {
    return `${a.contexto}:${a.id}`;
  }
  private limpiar() {
    for (const [id, r] of this.analisis) if (r.vence <= Date.now()) this.analisis.delete(id);
  }
  async analizar(a: Actor, paciente: PacienteIngreso, file: Express.Multer.File) {
    if (
      !file?.buffer ||
      file.buffer.length === 0 ||
      file.buffer.length > MAX_PDF_PRE ||
      file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
    )
      throw new BadRequestException('Adjunta un PDF válido de hasta 20 MB.');
    const propietario = this.propietario(a);
    if (this.ocupados.has(propietario) || this.workers.size >= 4)
      throw new ServiceUnavailableException(
        'Hay una lectura en curso. Espera y vuelve a intentar.'
      );
    this.ocupados.add(propietario);
    try {
      const contenido = await this.extraer(file.buffer);
      const datos = leerPrefactura(contenido, paciente);
      this.limpiar();
      const propios = [...this.analisis].filter(([, r]) => r.propietario === propietario);
      if (propios.length >= 5) this.analisis.delete(propios[0][0]);
      if (this.analisis.size >= 1000)
        throw new ServiceUnavailableException(
          'Hay demasiados análisis pendientes. Reintenta en unos minutos.'
        );
      const resultado: AnalisisPre = {
        ...datos,
        id: randomUUID(),
        propietario,
        vence: Date.now() + 15 * 60000,
        paciente,
        sha256: createHash('sha256').update(file.buffer).digest('hex'),
        bytes: file.buffer.length,
      };
      this.analisis.set(resultado.id, resultado);
      const { propietario: _, ...publico } = resultado;
      return publico;
    } finally {
      this.ocupados.delete(propietario);
    }
  }
  obtener(a: Actor, id: string): AnalisisPre {
    const resultado = this.analisis.get(id);
    if (
      !resultado ||
      resultado.propietario !== this.propietario(a) ||
      resultado.vence <= Date.now()
    )
      throw new ConflictException('La lectura del PDF venció. Vuelve a adjuntar la prefactura.');
    return resultado;
  }
  consumir(id: string) {
    this.analisis.delete(id);
  }
  private extraer(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const worker = spawn(
        process.execPath,
        ['--max-old-space-size=256', '-e', PARSER, require.resolve('pdf-parse')],
        {
          windowsHide: true,
          shell: false,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );
      this.workers.add(worker);
      let terminado = false;
      const fin = (error?: Error, valor?: string) => {
        if (terminado) return;
        terminado = true;
        clearTimeout(timer);
        this.workers.delete(worker);
        worker.kill();
        error ? reject(error) : resolve(valor);
      };
      const invalido = () =>
        new BadRequestException(
          'No se pudo leer el PDF: revisa que sea digital, válido, sin contraseña y de hasta 500 páginas.'
        );
      const timer = setTimeout(
        () =>
          fin(
            new BadRequestException(
              'La lectura del PDF superó 30 segundos. Adjunta una prefactura más pequeña.'
            )
          ),
        30000
      );
      const partes: Buffer[] = [];
      let bytes = 0;
      worker.stdout.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > 8 * 1024 * 1024) fin(invalido());
        else partes.push(chunk);
      });
      worker.stderr.on('data', () => {});
      worker.once('error', () => fin(invalido()));
      worker.once('close', code => {
        if (terminado) return;
        try {
          const r = JSON.parse(Buffer.concat(partes).toString('utf8'));
          if (code !== 0 || r.error || typeof r.texto !== 'string') fin(invalido());
          else fin(undefined, r.texto);
        } catch {
          fin(invalido());
        }
      });
      worker.stdin.on('error', () => fin(invalido()));
      worker.stdin.end(buffer);
    });
  }
}
