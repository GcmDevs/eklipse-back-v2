import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { spawn, ChildProcess } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { PassThrough, pipeline } from 'node:stream';
import JSZip = require('jszip');
import {
  access,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rm,
  rename,
  unlink,
  writeFile,
  stat,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  ColaReportes,
  EjecucionReportes,
  HistorialReportes,
  FiltrosHistorialReportes,
  ProgresoReportes,
} from '../../domain/ejecucion';
import {
  DOCUMENTOS_POR_PROCESO,
  PROCESOS_REPORTES,
  ProcesoReportes,
  ingresoElegibleParaProceso,
} from '../../domain/proceso';
import { ConsultaColaReportesImpl } from './consulta-cola.impl';

const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface PropietarioReportes {
  usuario: number;
  contexto: string;
  esDinamica: boolean;
}
interface ArchivoWorker {
  name: string;
  relativePath: string;
  bytes: number;
  group: number;
  totalGroups: number;
  kind: 'historias-clinicas' | 'enfermeria' | 'prefactura' | 'soportes-requeridos';
  unified?: boolean;
  pages?: number;
  superseded?: boolean;
  sha256?: string;
}
interface EstadoWorker {
  supportManifest?: { relativePath: string; sha256: string };
  pid?: number;
  document?: string;
  admission?: string;
  process?: ProcesoReportes;
  completedStages?: ArchivoWorker['kind'][];
  notices?: {
    type:
      | 'recalculo-ingreso'
      | 'ordenes-sin-confirmar'
      | 'enfermeria-sin-notas'
      | 'historias-sin-folios'
      | 'prefactura-sin-servicios'
      | 'prefactura-no-disponible';
    admission: string;
    occurredAt: string;
    message: string;
    orders: string[];
  }[];
  pendingFailures?: NonNullable<EstadoWorker['failure']>[];
  failure?: {
    occurredAt: string;
    message: string;
    step: string;
    stage: string;
    group: number | null;
    totalGroups: number | null;
    details: string;
  };
  failures?: EstadoWorker['failure'][];
  status: 'queued' | 'starting' | 'running' | 'complete' | 'failed' | 'prefactura-unavailable';
  message: string;
  updatedAt: string;
  files: ArchivoWorker[];
  progress?: {
    stage: ProgresoReportes['etapa'];
    completed: number;
    total: number | null;
    current: number | null;
    generalPercentage?: number;
  };
}
interface Trabajo {
  id: string;
  documento: string;
  ingreso: string;
  proceso?: ProcesoReportes;
  tipoIngreso?: string;
  propietario: PropietarioReportes;
  createdAt: string;
  pid?: number;
  loteId?: string;
  enColaDesde?: string;
  secuenciaCola?: number;
  reanudar?: boolean;
  startedAt?: string;
  deadline?: string;
  reemplazadoPor?: string;
}

function procesoVivo(pid?: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export function rutaArchivoPermitida(carpeta: string, ruta: string): string {
  const destino = resolve(carpeta, ruta);
  const diferencia = relative(carpeta, destino);
  if (
    !diferencia ||
    diferencia === '..' ||
    diferencia.startsWith('..' + sep) ||
    isAbsolute(diferencia)
  ) {
    throw new NotFoundException('Archivo no disponible.');
  }
  return destino;
}

@Injectable()
export class EjecucionesReportesImpl implements OnModuleDestroy, OnModuleInit {
  private child?: ChildProcess;
  private reservando = false;
  private cola: string[] = [];
  private activo?: string;
  private secuenciaCola = 0;
  private inicializada?: Promise<void>;
  private mutex: Promise<unknown> = Promise.resolve();
  private detenido = false;
  private programado?: ReturnType<typeof setTimeout>;

  constructor(private readonly consultaClinica: ConsultaColaReportesImpl) {}

  private exclusivo<T>(operacion: () => Promise<T>): Promise<T> {
    const siguiente = this.mutex.then(operacion, operacion);
    this.mutex = siguiente.catch(() => {});
    return siguiente;
  }

  private mismoPropietario(a: PropietarioReportes, b: PropietarioReportes): boolean {
    return a.usuario === b.usuario && a.contexto === b.contexto && a.esDinamica === b.esDinamica;
  }

  private estadoPerdido(job: Trabajo): EstadoWorker {
    const failure = {
      occurredAt: new Date().toISOString(),
      message: 'No se pudo recuperar el estado de esta solicitud. Puedes reanudarla.',
      step: 'Recuperando la solicitud vigente.',
      stage: 'preparacion',
      group: null,
      totalGroups: null,
      details: 'El archivo de estado está ausente o no es válido.',
    };
    return {
      process: job.proceso,
      status: 'failed',
      message: failure.message,
      updatedAt: failure.occurredAt,
      files: [],
      failure,
      failures: [failure],
      pendingFailures: [failure],
    };
  }

  private async registros(
    trabajos: string,
    propietario?: PropietarioReportes
  ): Promise<Array<{ job: Trabajo; estado: EstadoWorker }>> {
    const carpetas = await readdir(trabajos, { withFileTypes: true }).catch(error => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    const encontrados: Array<{ job: Trabajo; estado: EstadoWorker }> = [];
    for (const carpeta of carpetas) {
      if (!carpeta.isDirectory() || !JOB_ID.test(carpeta.name)) continue;
      try {
        const job: Trabajo = JSON.parse(
          await readFile(join(trabajos, carpeta.name, 'job.json'), 'utf8')
        );
        if (
          job.id !== carpeta.name ||
          !job.propietario ||
          !PROCESOS_REPORTES.includes(job.proceso) ||
          !/^\d{1,20}$/.test(job.documento) ||
          !/^\d{1,20}$/.test(job.ingreso)
        )
          continue;
        if (
          propietario &&
          (!job.propietario || !this.mismoPropietario(job.propietario, propietario))
        )
          continue;
        let estado: EstadoWorker;
        try {
          estado = JSON.parse(
            await readFile(join(trabajos, carpeta.name, 'execution.json'), 'utf8')
          );
          if (
            !Array.isArray(estado.files) ||
            ![
              'queued',
              'starting',
              'running',
              'complete',
              'failed',
              'prefactura-unavailable',
            ].includes(estado.status)
          )
            estado = this.estadoPerdido(job);
        } catch {
          estado = this.estadoPerdido(job);
        }
        encontrados.push({ job, estado });
      } catch {
        /* Un archivo incompleto nunca se convierte en una solicitud ejecutable. */
      }
    }
    return encontrados;
  }

  private clave(job: Trabajo): string {
    return JSON.stringify([
      job.propietario.usuario,
      job.propietario.contexto,
      job.propietario.esDinamica,
      job.documento,
      job.ingreso,
      job.proceso,
    ]);
  }

  private compararSolicitudes(a: Trabajo, b: Trabajo): number {
    return (
      (a.secuenciaCola ?? 0) - (b.secuenciaCola ?? 0) ||
      (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0) ||
      a.id.localeCompare(b.id)
    );
  }

  private ultimos(registros: Array<{ job: Trabajo; estado: EstadoWorker }>) {
    const porClave = new Map<string, { job: Trabajo; estado: EstadoWorker }>();
    for (const registro of registros) {
      if (registro.job.reemplazadoPor) continue;
      const clave = this.clave(registro.job);
      const anterior = porClave.get(clave);
      if (!anterior || this.compararSolicitudes(registro.job, anterior.job) > 0)
        porClave.set(clave, registro);
    }
    return [...porClave.values()];
  }

  private async vigente(job: Trabajo, trabajos: string): Promise<boolean> {
    if (!job.proceso || job.reemplazadoPor) return false;
    return (
      this.ultimos(await this.registros(trabajos, job.propietario)).find(
        registro => this.clave(registro.job) === this.clave(job)
      )?.job.id === job.id
    );
  }

  private async retirarAnteriores(
    job: Trabajo,
    estado: EstadoWorker,
    disponibles: Set<string>,
    soportesCompletos: boolean
  ) {
    if (!['complete', 'failed', 'prefactura-unavailable'].includes(estado.status)) return;
    const ausenciaConfirmada =
      estado.status === 'complete' &&
      DOCUMENTOS_POR_PROCESO[job.proceso].every(
        tipo =>
          tipo === 'factura' ||
          (tipo === 'soportes-requeridos' && soportesCompletos) ||
          (tipo === 'historias-clinicas' &&
            estado.notices?.some(
              notice => notice.type === 'historias-sin-folios' && notice.admission === job.ingreso
            )) ||
          (tipo === 'enfermeria' &&
            estado.notices?.some(
              notice => notice.type === 'enfermeria-sin-notas' && notice.admission === job.ingreso
            ))
      );
    if (!disponibles.size && !ausenciaConfirmada) return;
    const { trabajos } = await this.ubicacion();
    if (!(await this.vigente(job, trabajos))) return;
    const raiz = await realpath(trabajos);
    for (const anterior of await this.registros(trabajos, job.propietario)) {
      if (
        anterior.job.id === job.id ||
        this.clave(anterior.job) !== this.clave(job) ||
        this.compararSolicitudes(anterior.job, job) >= 0 ||
        !['complete', 'failed', 'prefactura-unavailable'].includes(anterior.estado.status) ||
        anterior.job.id === this.activo
      )
        continue;
      try {
        const carpeta = rutaArchivoPermitida(trabajos, anterior.job.id);
        const real = await realpath(carpeta);
        rutaArchivoPermitida(raiz, real);
        const guardado: Trabajo = JSON.parse(await readFile(join(carpeta, 'job.json'), 'utf8'));
        if (
          guardado.id !== anterior.job.id ||
          this.clave(guardado) !== this.clave(job) ||
          !(await this.vigente(job, trabajos))
        )
          continue;
        if (guardado.reemplazadoPor !== job.id)
          await this.guardar(carpeta, 'job.json', { ...guardado, reemplazadoPor: job.id });
        for (const entrada of await readdir(carpeta, { withFileTypes: true })) {
          if (entrada.name === 'job.json' || entrada.name === 'execution.json') continue;
          const destino = rutaArchivoPermitida(real, entrada.name);
          await rm(destino, { recursive: entrada.isDirectory(), force: true });
        }
      } catch {
        // El vigente ya está validado; una lectura posterior reintenta una limpieza bloqueada en Windows.
      }
    }
  }

  private async persistirCola(trabajos: string, pendientes = this.cola) {
    await this.guardar(trabajos, 'queue.json', {
      secuencia: this.secuenciaCola,
      pendientes,
      activo: this.activo ?? null,
    });
  }

  private inicializar(): Promise<void> {
    if (!this.inicializada)
      this.inicializada = (async () => {
        const { trabajos } = await this.ubicacion();
        await mkdir(trabajos, { recursive: true });
        try {
          const indice = JSON.parse(await readFile(join(trabajos, 'queue.json'), 'utf8'));
          if (Number.isSafeInteger(indice.secuencia)) this.secuenciaCola = indice.secuencia;
        } catch {
          /* Los manifiestos de cada trabajo permiten reconstruir el índice. */
        }
        const registros = await this.registros(trabajos);
        for (const { job, estado } of registros) {
          this.secuenciaCola = Math.max(this.secuenciaCola, job.secuenciaCola ?? 0);
          if (['starting', 'running'].includes(estado.status)) {
            if (
              !procesoVivo(job.pid) &&
              procesoVivo(estado.pid) &&
              estado.document === job.documento &&
              estado.admission === job.ingreso &&
              estado.process === job.proceso
            ) {
              job.pid = estado.pid;
              await this.guardar(join(trabajos, job.id), 'job.json', job);
              try {
                const bloqueo = JSON.parse(await readFile(join(trabajos, 'runner.lock'), 'utf8'));
                if (!bloqueo.childPid && !procesoVivo(bloqueo.pid))
                  await writeFile(
                    join(trabajos, 'runner.lock'),
                    JSON.stringify({ ...bloqueo, childPid: job.pid }),
                    'utf8'
                  );
              } catch {
                /* La ausencia del bloqueo no autoriza ejecutar otro worker vivo. */
              }
            }
            if (procesoVivo(job.pid)) this.activo ??= job.id;
            else
              await this.registrarFallo(
                job,
                estado,
                'La ejecución se interrumpió. Puedes reanudar conservando los PDF guardados.'
              );
          }
        }
        this.cola = this.ultimos(registros)
          .filter(({ estado }) => estado.status === 'queued')
          .sort(
            (a, b) =>
              (a.job.secuenciaCola ?? 0) - (b.job.secuenciaCola ?? 0) ||
              (a.job.enColaDesde ?? a.job.createdAt).localeCompare(
                b.job.enColaDesde ?? b.job.createdAt
              )
          )
          .map(({ job }) => job.id);
        await this.persistirCola(trabajos);
      })().catch(error => {
        this.inicializada = undefined;
        throw error;
      });
    return this.inicializada;
  }

  async onModuleInit() {
    try {
      await this.inicializar();
      this.programar();
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) throw error;
    }
  }

  private programar(demora = 0) {
    if (this.detenido || this.programado) return;
    this.programado = setTimeout(() => {
      this.programado = undefined;
      void this.exclusivo(() => this.procesarCola()).catch(() => this.programar(1000));
    }, demora);
    this.programado.unref();
  }

  private posicion(id: string): number | undefined {
    if (id === this.activo) return 1;
    const indice = this.cola.indexOf(id);
    return indice < 0 ? undefined : indice + (this.activo ? 2 : 1);
  }

  private async registrarFallo(job: Trabajo, estado: EstadoWorker, mensaje: string) {
    const failure = {
      occurredAt: new Date().toISOString(),
      message: mensaje,
      step: estado.message,
      stage: estado.progress?.stage ?? 'preparacion',
      group: estado.progress?.current ?? null,
      totalGroups: estado.progress?.total ?? null,
      details: mensaje,
    };
    await this.guardar(join((await this.ubicacion()).trabajos, job.id), 'execution.json', {
      ...estado,
      status: 'failed',
      updatedAt: failure.occurredAt,
      message: mensaje,
      failure,
      failures: [...(estado.failures ?? []), failure],
      pendingFailures: [...(estado.pendingFailures ?? []), failure],
    });
  }

  private async procesarCola() {
    if (this.detenido) return;
    await this.inicializar();
    const { trabajos } = await this.ubicacion();
    if (this.activo) {
      if (this.child) return;
      const registro = (await this.registros(trabajos)).find(({ job }) => job.id === this.activo);
      if (registro && procesoVivo(registro.job.pid)) {
        const limite = this.duracionMaxima();
        const inicio = Date.parse(
          registro.job.startedAt ?? registro.job.enColaDesde ?? registro.job.createdAt
        );
        const deadline =
          Date.parse(registro.job.deadline ?? '') ||
          (Number.isFinite(inicio) ? inicio : Date.now()) + limite;
        if (!registro.job.deadline) {
          registro.job.startedAt = new Date(deadline - limite).toISOString();
          registro.job.deadline = new Date(deadline).toISOString();
          await this.guardar(join(trabajos, registro.job.id), 'job.json', registro.job);
        }
        if (Date.now() >= deadline && registro.job.pid !== process.pid) {
          let bloqueo: { childPid?: number };
          try {
            bloqueo = JSON.parse(await readFile(join(trabajos, 'runner.lock'), 'utf8'));
          } catch {
            bloqueo = {};
          }
          if (bloqueo.childPid === registro.job.pid) {
            this.detenerPid(registro.job.pid);
            await this.registrarFallo(
              registro.job,
              registro.estado,
              'La generación superó el tiempo máximo. Puedes reanudar conservando los PDF guardados.'
            );
          }
        }
        this.programar(1000);
        return;
      }
      if (registro && ['starting', 'running'].includes(registro.estado.status))
        await this.registrarFallo(
          registro.job,
          registro.estado,
          'La ejecución se interrumpió. Puedes reanudar conservando los PDF guardados.'
        );
      this.activo = undefined;
    }
    while (this.cola.length && !this.child && !this.detenido) {
      const id = this.cola[0];
      const registro = (await this.registros(trabajos)).find(({ job }) => job.id === id);
      if (!registro || registro.estado.status !== 'queued') {
        this.cola.shift();
        continue;
      }
      const { job, estado } = registro;
      if (!(await this.vigente(job, trabajos))) {
        this.cola.shift();
        continue;
      }
      try {
        const consulta = await this.consultaClinica.consultar(job.documento, job.propietario);
        const ingreso = consulta.ingresos.find(
          ingreso => String(ingreso.consecutivo) === job.ingreso
        );
        if (
          !consulta.paciente ||
          consulta.paciente.documento !== job.documento ||
          !ingreso ||
          !ingresoElegibleParaProceso(ingreso, job.proceso)
        )
          throw new BadRequestException(
            'El ingreso ya no está disponible para el proceso solicitado.'
          );
        job.tipoIngreso = ingreso.tipoIngreso?.trim() || 'Desconocido';
      } catch (error) {
        await this.registrarFallo(
          job,
          estado,
          error instanceof BadRequestException
            ? error.message
            : 'No fue posible validar el ingreso antes de iniciar. Puedes reanudarlo.'
        );
        this.cola.shift();
        await this.persistirCola(trabajos);
        continue;
      }
      let bloqueo: string | undefined;
      try {
        bloqueo = await this.bloquear(trabajos);
        this.cola.shift();
        this.activo = id;
        await this.persistirCola(trabajos);
        await this.iniciar(job, estado, bloqueo);
      } catch (error) {
        if (bloqueo && !this.child) await unlink(bloqueo).catch(() => {});
        if (error instanceof ConflictException) {
          this.programar(1000);
          return;
        }
        this.cola = this.cola.filter(elemento => elemento !== id);
        this.activo = undefined;
        await this.registrarFallo(
          job,
          estado,
          'No fue posible iniciar el ejecutor de reportes. Puedes reanudarlo.'
        );
        await this.persistirCola(trabajos);
      }
    }
    await this.persistirCola(trabajos);
  }

  private detener(child: ChildProcess) {
    if (!child.pid || child.exitCode !== null) return;
    if (process.platform === 'win32') {
      const cierre = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        shell: false,
        stdio: 'ignore',
      });
      cierre.once('error', () => child.kill());
    } else child.kill();
  }

  private duracionMaxima() {
    const limite = Number(process.env.EKLIPSE_AUTOMATION_TIMEOUT_MS ?? 1800000);
    return Number.isFinite(limite) && limite > 0 ? limite : 1800000;
  }

  private detenerPid(pid: number) {
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) return;
    if (process.platform === 'win32') {
      const cierre = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        shell: false,
        stdio: 'ignore',
      });
      cierre.once('error', () => {
        try {
          process.kill(pid);
        } catch {}
      });
    } else {
      try {
        process.kill(pid);
      } catch {}
    }
  }

  private async ubicacion() {
    const opciones = process.env.EKLIPSE_AUTOMATION_DIR
      ? [resolve(process.env.EKLIPSE_AUTOMATION_DIR)]
      : [
          resolve(process.cwd(), '../Automatización'),
          resolve(process.cwd(), '../../Automatización'),
        ];
    for (const carpeta of opciones) {
      try {
        await access(join(carpeta, 'src/worker.ts'));
        return { carpeta, trabajos: join(carpeta, 'artifacts/eklipse-jobs') };
      } catch {
        /* Probar la siguiente carpeta local. */
      }
    }
    throw new ServiceUnavailableException(
      'Configura EKLIPSE_AUTOMATION_DIR con la carpeta de automatización.'
    );
  }

  private async guardar(carpeta: string, nombre: string, valor: unknown) {
    const destino = join(carpeta, nombre);
    const temporal = destino + '.' + randomUUID() + '.tmp';
    await writeFile(temporal, JSON.stringify(valor, null, 2), 'utf8');
    for (let intento = 0; ; intento++) {
      try {
        await rename(temporal, destino);
        break;
      } catch (error) {
        if (
          intento >= 4 ||
          !['EPERM', 'EBUSY', 'EACCES'].includes((error as NodeJS.ErrnoException).code)
        )
          throw error;
        await new Promise(resolve => setTimeout(resolve, 25 * 2 ** intento));
      }
    }
  }

  private async bloquear(trabajos: string) {
    const ruta = join(trabajos, 'runner.lock');
    const crear = async () => {
      const archivo = await open(ruta, 'wx');
      try {
        await archivo.writeFile(JSON.stringify({ pid: process.pid }));
      } finally {
        await archivo.close();
      }
    };
    try {
      await crear();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      let bloqueo: { pid: number; childPid?: number };
      try {
        bloqueo = JSON.parse(await readFile(ruta, 'utf8'));
      } catch {
        throw new ConflictException(
          'La automatización está ocupada. Intenta nuevamente en unos momentos.'
        );
      }
      if (procesoVivo(bloqueo.pid) || procesoVivo(bloqueo.childPid)) {
        throw new ConflictException('Ya hay una generación en curso. Espera a que termine.');
      }
      await unlink(ruta);
      try {
        await crear();
      } catch {
        throw new ConflictException('Ya hay una generación en curso. Espera a que termine.');
      }
    }
    return ruta;
  }

  async reanudar(id: string, propietario: PropietarioReportes) {
    await this.inicializar();
    const { job, estado, disponibles, soportesCompletos } = await this.leer(id, propietario);
    if (!job.proceso)
      throw new ConflictException(
        'Los reportes anteriores son de consulta. Genera una nueva ejecución seleccionando el proceso.'
      );
    if (['queued', 'starting', 'running'].includes(estado.status))
      return this.respuesta(job, estado);
    if (
      estado.status !== 'failed' &&
      !(
        estado.status === 'complete' &&
        this.respuesta(job, estado, disponibles, soportesCompletos).documentosPendientes.includes(
          'soportes-requeridos'
        )
      )
    )
      throw new ConflictException('Solo puedes reanudar una ejecución que se haya detenido.');
    return this.crear(
      job.documento,
      job.ingreso,
      propietario,
      job.proceso,
      id,
      job.tipoIngreso ?? 'Desconocido'
    );
  }

  async crear(
    documento: string,
    ingreso: string,
    propietario: PropietarioReportes,
    proceso: ProcesoReportes,
    reanudarId?: string,
    tipoIngreso = 'Desconocido'
  ) {
    if (!PROCESOS_REPORTES.includes(proceso))
      throw new BadRequestException('Selecciona un proceso de auditoría válido.');
    if (!/^\d{1,20}$/.test(documento) || !/^\d{1,20}$/.test(ingreso))
      throw new BadRequestException('Revisa la cédula y el ingreso.');
    if (propietario.contexto !== (process.env.EKLIPSE_AUTOMATION_CONTEXT ?? 'ALTACENTRO'))
      throw new BadRequestException(
        'La automatización no está configurada para la sede de tu sesión.'
      );
    await this.inicializar();
    const respuesta = await this.exclusivo(async () => {
      const { trabajos } = await this.ubicacion();
      const registros = this.ultimos(await this.registros(trabajos));
      const duplicado = registros.find(
        ({ job, estado }) =>
          this.mismoPropietario(job.propietario, propietario) &&
          job.documento === documento &&
          job.ingreso === ingreso &&
          job.proceso === proceso &&
          ['queued', 'starting', 'running'].includes(estado.status)
      );
      if (duplicado && (!reanudarId || duplicado.job.id === reanudarId))
        return this.respuesta(duplicado.job, duplicado.estado);
      if (duplicado)
        throw new ConflictException('Ya existe una solicitud activa para ese ingreso y proceso.');
      const anterior = reanudarId ? await this.leer(reanudarId, propietario) : undefined;
      if (
        anterior &&
        (anterior.job.documento !== documento ||
          anterior.job.ingreso !== ingreso ||
          anterior.job.proceso !== proceso ||
          anterior.estado.process !== proceso)
      )
        throw new ConflictException(
          'La ejecución no corresponde al paciente, ingreso o proceso seleccionado.'
        );
      if (
        anterior &&
        anterior.estado.status !== 'failed' &&
        !(
          anterior.estado.status === 'complete' &&
          this.respuesta(
            anterior.job,
            anterior.estado,
            anterior.disponibles,
            anterior.soportesCompletos
          ).documentosPendientes.includes('soportes-requeridos')
        )
      )
        throw new ConflictException('La ejecución ya se está procesando o terminó.');
      if (
        anterior &&
        this.activo === anterior.job.id &&
        (this.child || procesoVivo(anterior.job.pid))
      )
        throw new ConflictException('Espera a que el ejecutor cierre para reanudar.');
      const pendientesUsuario = registros.filter(
        ({ job, estado }) =>
          this.mismoPropietario(job.propietario, propietario) &&
          ['queued', 'starting', 'running'].includes(estado.status)
      );
      const loteId =
        pendientesUsuario.sort((a, b) => (b.job.secuenciaCola ?? 0) - (a.job.secuenciaCola ?? 0))[0]
          ?.job.loteId ?? randomUUID();
      const job: Trabajo = {
        ...(anterior?.job ?? {
          id: randomUUID(),
          documento,
          ingreso,
          proceso,
          propietario,
          createdAt: new Date().toISOString(),
        }),
        loteId,
        tipoIngreso: tipoIngreso.trim() || 'Desconocido',
        enColaDesde: new Date().toISOString(),
        secuenciaCola: ++this.secuenciaCola,
        reanudar: Boolean(anterior),
        pid: undefined,
        startedAt: undefined,
        deadline: undefined,
      };
      const destino = join(trabajos, job.id);
      if (!anterior) await mkdir(destino);
      const estado: EstadoWorker = {
        ...anterior?.estado,
        process: proceso,
        status: 'queued',
        updatedAt: new Date().toISOString(),
        completedStages: anterior?.estado.completedStages ?? [],
        message: anterior
          ? 'Reanudación en cola. Conservando los PDF guardados.'
          : 'En cola para generar los reportes.',
        files: anterior?.estado.files ?? [],
        failure: undefined,
      };
      try {
        if (!anterior) await this.guardar(destino, 'execution.json', estado);
        await this.persistirCola(trabajos, [...this.cola, job.id]);
        await this.guardar(destino, 'job.json', job);
        if (anterior) await this.guardar(destino, 'execution.json', estado);
      } catch (error) {
        if (anterior) {
          await this.guardar(destino, 'job.json', anterior.job).catch(() => {});
        } else {
          const raiz = await realpath(trabajos);
          const nuevo = await realpath(destino);
          rutaArchivoPermitida(raiz, nuevo);
          await rm(nuevo, { recursive: true, force: true }).catch(() => {});
        }
        await this.persistirCola(trabajos).catch(() => {});
        throw error;
      }
      this.cola.push(job.id);
      return this.respuesta(job, estado);
    });
    this.programar();
    return respuesta;
  }

  private async iniciar(job: Trabajo, anteriorEstado: EstadoWorker, bloqueo: string) {
    this.reservando = true;
    try {
      const { carpeta, trabajos } = await this.ubicacion();
      const destino = join(trabajos, job.id);
      const documento = job.documento;
      const ingreso = job.ingreso;
      const proceso = job.proceso;
      const anterior = job.reanudar;
      const inicio: EstadoWorker = {
        ...anteriorEstado,
        status: 'starting',
        updatedAt: new Date().toISOString(),
        message: anterior
          ? 'Reanudando desde el último avance guardado.'
          : 'Iniciando la generación.',
        failure: undefined,
      };
      await this.guardar(destino, 'execution.json', inicio);
      const child = spawn(
        process.env.EKLIPSE_AUTOMATION_NODE || process.execPath,
        [
          '--env-file-if-exists=.env',
          'src/worker.ts',
          '--documento',
          documento,
          '--ingreso',
          ingreso,
          '--carpeta',
          destino,
          '--proceso',
          proceso,
          '--tipo-ingreso',
          job.tipoIngreso?.trim() || 'Desconocido',
          ...(anterior ? ['--reanudar'] : []),
        ],
        {
          cwd: carpeta,
          windowsHide: true,
          shell: false,
          stdio: 'ignore',
          // DG Web usa su propio .env; no recibe los secretos del backend de Eklipse.
          env: Object.fromEntries(
            Object.entries(process.env).filter(([key]) =>
              /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|HOMEDRIVE|HOMEPATH|PROGRAMFILES|PROGRAMFILES\(X86\))$/i.test(
                key
              )
            )
          ),
        }
      );
      this.child = child;
      let terminarPreparacion: () => void;
      const preparacion = new Promise<void>(resolve => {
        terminarPreparacion = resolve;
      });
      job.pid = child.pid;
      const rutaBloqueo = bloqueo;
      const limite = this.duracionMaxima();
      job.startedAt = new Date().toISOString();
      job.deadline = new Date(Date.now() + limite).toISOString();
      let agotado = false;
      let errorArranque: string | undefined;
      const timer = setTimeout(() => {
        agotado = true;
        this.detener(child);
      }, limite);
      timer.unref();
      child.once('error', (error: NodeJS.ErrnoException) => {
        errorArranque = error.code ?? 'ERROR';
      });
      child.once('close', () => {
        clearTimeout(timer);
        void (async () => {
          await preparacion;
          try {
            let estado: EstadoWorker | undefined;
            try {
              estado = JSON.parse(await readFile(join(destino, 'execution.json'), 'utf8'));
            } catch {
              /* No arrancó. */
            }
            if (
              !estado ||
              !['complete', 'failed', 'prefactura-unavailable'].includes(estado.status)
            ) {
              const message = errorArranque
                ? `No se pudo iniciar el ejecutor de reportes (${errorArranque}).`
                : agotado
                  ? 'La generación superó el tiempo máximo.'
                  : 'La ejecución se interrumpió. Revisa Node.js, el navegador y el acceso a DG Web.';
              const failure = {
                occurredAt: new Date().toISOString(),
                message,
                step: estado?.message ?? 'Iniciando la ejecución.',
                stage: estado?.progress?.stage ?? 'preparacion',
                group: estado?.progress?.current ?? null,
                totalGroups: estado?.progress?.total ?? null,
                details: message,
              };
              await this.guardar(destino, 'execution.json', {
                ...estado,
                status: 'failed',
                updatedAt: new Date().toISOString(),
                files: estado?.files ?? [],
                ...(estado?.progress ? { progress: estado.progress } : {}),
                failure,
                failures: [...(estado?.failures ?? []), failure],
                pendingFailures: [...(estado?.pendingFailures ?? []), failure],
                message: `${message} Puedes reanudar conservando los PDF guardados.`,
              });
              await this.guardar(destino, `fallo-${Date.now()}.json`, failure);
            }
            await this.leer(job.id, job.propietario).catch(() => {});
          } finally {
            await unlink(rutaBloqueo).catch(() => {});
            if (this.child === child) {
              if (this.activo === job.id) this.activo = undefined;
              try {
                await this.persistirCola(trabajos);
              } finally {
                this.child = undefined;
                this.programar();
              }
            }
          }
        })().catch(() => {});
      });
      try {
        await this.guardar(destino, 'job.json', job);
        await writeFile(bloqueo, JSON.stringify({ pid: process.pid, childPid: child.pid }), 'utf8');
      } catch (error) {
        this.detener(child);
        throw error;
      } finally {
        terminarPreparacion();
      }
    } catch (error) {
      if (!this.child) await unlink(bloqueo).catch(() => {});
      throw error;
    } finally {
      this.reservando = false;
    }
  }

  private respuesta(
    job: Trabajo,
    estado: EstadoWorker,
    disponibles?: Set<string>,
    soportesCompletos = false
  ): EjecucionReportes {
    const archivos = estado.files.flatMap((archivo, indice) =>
      archivo.superseded ||
      (disponibles && !disponibles.has(String(indice))) ||
      (job.proceso && !DOCUMENTOS_POR_PROCESO[job.proceso].includes(archivo.kind))
        ? []
        : [
            {
              id: String(indice),
              nombre: archivo.name,
              bytes: archivo.bytes,
              tipo: archivo.kind,
              grupo: archivo.group,
              totalGrupos: archivo.totalGroups,
              ...(archivo.unified ? { unificado: true, paginas: archivo.pages } : {}),
            },
          ]
    );
    const documentosPendientes = job.proceso
      ? DOCUMENTOS_POR_PROCESO[job.proceso].filter(tipo => {
          if (
            tipo === 'factura' ||
            estado.process !== job.proceso ||
            !estado.completedStages?.includes(tipo)
          )
            return true;
          if (tipo === 'soportes-requeridos') return !soportesCompletos;
          const documentos = archivos.filter(archivo => archivo.tipo === tipo);
          if (
            documentos.some(
              archivo =>
                archivo.unificado &&
                Number.isSafeInteger(archivo.paginas) &&
                archivo.paginas > 0 &&
                Number.isSafeInteger(archivo.totalGrupos) &&
                archivo.totalGrupos > 0
            )
          )
            return false;
          const total = documentos[0]?.totalGrupos;
          return (
            !Number.isSafeInteger(total) ||
            total <= 0 ||
            documentos.length !== total ||
            documentos.some(
              archivo =>
                archivo.totalGrupos !== total ||
                !Number.isSafeInteger(archivo.grupo) ||
                archivo.grupo < 1 ||
                archivo.grupo > total
            ) ||
            new Set(documentos.map(archivo => archivo.grupo)).size !== total
          );
        })
      : [];
    return {
      id: job.id,
      documento: job.documento,
      ingreso: job.ingreso,
      ...(job.loteId ? { loteId: job.loteId } : {}),
      ...(job.enColaDesde ? { enColaDesde: job.enColaDesde } : {}),
      ...(['queued', 'starting', 'running'].includes(estado.status)
        ? { posicionCola: this.posicion(job.id) }
        : {}),
      proceso: job.proceso,
      disponibleParaProceso: Boolean(
        job.proceso && estado.status === 'complete' && !documentosPendientes.length
      ),
      documentosPendientes,
      createdAt: job.createdAt,
      estado: estado.status,
      mensaje: estado.message,
      updatedAt: estado.updatedAt,
      avisos: (estado.notices ?? []).map(notice => ({
        tipo: notice.type,
        ingreso: notice.admission,
        fecha: notice.occurredAt,
        mensaje: notice.message,
        ordenes: notice.orders,
      })),
      fallas: (estado.failures ?? []).flatMap(failure =>
        failure
          ? [
              {
                fecha: failure.occurredAt,
                mensaje: failure.message,
                paso: failure.step,
                etapa: failure.stage,
                grupo: failure.group,
                totalGrupos: failure.totalGroups,
                detalle: failure.details,
              },
            ]
          : []
      ),
      reanudable: Boolean(
        job.proceso &&
        (estado.status === 'failed' ||
          (estado.status === 'complete' && documentosPendientes.includes('soportes-requeridos')))
      ),
      ...(estado.pendingFailures?.length
        ? {
            fallasPendientes: estado.pendingFailures.map(failure => ({
              fecha: failure.occurredAt,
              mensaje: failure.message,
              paso: failure.step,
              etapa: failure.stage,
              grupo: failure.group,
              totalGrupos: failure.totalGroups,
              detalle: failure.details,
            })),
          }
        : {}),
      ...(estado.failure
        ? {
            fallo: {
              fecha: estado.failure.occurredAt,
              mensaje: estado.failure.message,
              paso: estado.failure.step,
              etapa: estado.failure.stage,
              grupo: estado.failure.group,
              totalGrupos: estado.failure.totalGroups,
              detalle: estado.failure.details,
            },
          }
        : {}),
      ...(estado.progress
        ? {
            progreso: {
              etapa: estado.progress.stage,
              completados: estado.progress.completed,
              total: estado.progress.total,
              grupoActual: estado.progress.current,
              ...(estado.progress.generalPercentage === undefined
                ? {}
                : { porcentajeGeneral: estado.progress.generalPercentage }),
            },
          }
        : {}),
      archivos,
    };
  }

  private async validarSoportes(
    carpeta: string,
    job: Trabajo,
    estado: EstadoWorker,
    disponibles: Set<string>
  ): Promise<boolean> {
    if (!estado.completedStages?.includes('soportes-requeridos') || !estado.supportManifest)
      return false;
    try {
      const descriptor = estado.supportManifest;
      if (typeof descriptor.relativePath !== 'string' || !/^[a-f0-9]{64}$/.test(descriptor.sha256))
        return false;
      const ruta = await realpath(rutaArchivoPermitida(carpeta, descriptor.relativePath));
      rutaArchivoPermitida(await realpath(carpeta), ruta);
      const body = await readFile(ruta);
      if (createHash('sha256').update(body).digest('hex') !== descriptor.sha256) return false;
      const manifest = JSON.parse(body.toString('utf8'));
      if (
        manifest.admission !== job.ingreso ||
        manifest.status !== 'complete' ||
        !Array.isArray(manifest.supports) ||
        !manifest.supports.length
      )
        return false;
      let total = 0;
      let paginas = 0;
      for (const support of manifest.supports) {
        if (
          !Number.isSafeInteger(support.quantity) ||
          support.quantity < 0 ||
          !Array.isArray(support.files)
        )
          return false;
        if (support.quantity === 0) {
          if (support.status !== 'skipped' || support.files.length) return false;
        } else {
          if (support.status !== 'downloaded' || support.files.length !== support.quantity)
            return false;
          for (const file of support.files) {
            if (
              typeof file.file !== 'string' ||
              !/^soporte-\d{3,}-adjunto-\d{3,}\.pdf$/.test(file.file) ||
              !/^[a-f0-9]{64}$/.test(file.sha256) ||
              !Number.isSafeInteger(file.size) ||
              file.size < 1 ||
              !Number.isSafeInteger(file.pages) ||
              file.pages < 1
            )
              return false;
            paginas += file.pages;
          }
        }
        total += support.quantity;
      }
      if (!Number.isSafeInteger(total) || !Number.isSafeInteger(paginas)) return false;
      const publicados = estado.files
        .map((file, index) => ({ file, index }))
        .filter(({ file }) => file.kind === 'soportes-requeridos' && !file.superseded);
      if (total === 0) return !manifest.unified && !publicados.length;
      const unified = manifest.unified;
      if (
        !unified ||
        unified.file !== 'soportes-unificado.pdf' ||
        !/^[a-f0-9]{64}$/.test(unified.sha256) ||
        !Number.isSafeInteger(unified.size) ||
        unified.size < 1 ||
        unified.pages !== paginas ||
        !Number.isFinite(Date.parse(unified.savedAt))
      )
        return false;
      const expectedPath = resolve(dirname(ruta), unified.file);
      const expectedRealPath = await realpath(expectedPath);
      for (const { file, index } of publicados) {
        if (
          disponibles.has(String(index)) &&
          file.unified === true &&
          file.group === 1 &&
          file.totalGroups === total &&
          file.bytes === unified.size &&
          file.pages === unified.pages &&
          file.sha256 === unified.sha256 &&
          (await realpath(rutaArchivoPermitida(carpeta, file.relativePath))) === expectedRealPath
        )
          return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async leer(id: string, propietario: PropietarioReportes) {
    if (!JOB_ID.test(id)) throw new NotFoundException();
    const { trabajos } = await this.ubicacion();
    const carpeta = join(trabajos, id);
    let job: Trabajo;
    try {
      job = JSON.parse(await readFile(join(carpeta, 'job.json'), 'utf8'));
    } catch {
      throw new NotFoundException();
    }
    if (job.id !== id || !job.propietario || !PROCESOS_REPORTES.includes(job.proceso))
      throw new NotFoundException();
    if (
      job.propietario.usuario !== propietario.usuario ||
      job.propietario.contexto !== propietario.contexto ||
      job.propietario.esDinamica !== propietario.esDinamica
    )
      throw new NotFoundException();
    if (!(await this.vigente(job, trabajos)))
      throw new NotFoundException('La solicitud fue reemplazada o no tiene un proceso vigente.');
    let estado: EstadoWorker;
    try {
      estado = JSON.parse(await readFile(join(carpeta, 'execution.json'), 'utf8'));
      if (
        !Array.isArray(estado.files) ||
        !['queued', 'starting', 'running', 'complete', 'failed', 'prefactura-unavailable'].includes(
          estado.status
        )
      )
        estado = this.estadoPerdido(job);
    } catch {
      estado = this.estadoPerdido(job);
    }
    // Recupera los avisos que las ejecuciones anteriores guardaban solo junto a la prefactura.
    if (
      !estado.notices?.length &&
      /^\d{1,20}$/.test(job.documento) &&
      /^\d{1,20}$/.test(job.ingreso)
    ) {
      try {
        const notices: EstadoWorker['notices'] = JSON.parse(
          await readFile(
            join(carpeta, 'reportes', job.documento, job.ingreso, 'prefactura', 'avisos.json'),
            'utf8'
          )
        );
        if (Array.isArray(notices))
          estado.notices = notices.filter(
            notice =>
              notice.admission === job.ingreso &&
              [
                'recalculo-ingreso',
                'ordenes-sin-confirmar',
                'prefactura-sin-servicios',
                'prefactura-no-disponible',
              ].includes(notice.type) &&
              typeof notice.message === 'string' &&
              Array.isArray(notice.orders)
          );
      } catch {
        /* La ausencia de avisos antiguos no invalida una ejecución ni sus PDF. */
      }
    }
    // Mientras close guarda el resultado final, conservar el estado anterior evita
    // que la pantalla deje de consultar antes de conocer la causa del cierre.
    if (
      ['starting', 'running'].includes(estado.status) &&
      !this.reservando &&
      !procesoVivo(job.pid) &&
      (!this.child || this.child.pid !== job.pid)
    ) {
      const failure = {
        occurredAt: new Date().toISOString(),
        message: 'La ejecución se interrumpió.',
        step: estado.message,
        stage: estado.progress?.stage ?? 'preparacion',
        group: estado.progress?.current ?? null,
        totalGroups: estado.progress?.total ?? null,
        details: 'El proceso ejecutor se cerró antes de terminar.',
      };
      estado = {
        ...estado,
        status: 'failed',
        failure,
        failures: [...(estado.failures ?? []), failure],
        pendingFailures: [...(estado.pendingFailures ?? []), failure],
        message: 'La ejecución se interrumpió. Puedes reanudar desde el avance guardado.',
      };
      await this.guardar(carpeta, 'execution.json', estado);
      await this.guardar(carpeta, `fallo-${Date.now()}.json`, failure);
    }
    const disponibles = new Set<string>();
    let archivosAusentes = false;
    for (const [indice, archivo] of estado.files.entries()) {
      if (
        archivo.superseded ||
        (job.proceso && !DOCUMENTOS_POR_PROCESO[job.proceso].includes(archivo.kind))
      )
        continue;
      try {
        await this.rutaArchivo(carpeta, archivo, Boolean(job.proceso));
        disponibles.add(String(indice));
      } catch {
        archivosAusentes = true;
      }
    }
    if (
      job.proceso &&
      estado.status === 'complete' &&
      (archivosAusentes || estado.process !== job.proceso)
    ) {
      const failure = {
        occurredAt: new Date().toISOString(),
        message: 'Algunos PDF guardados ya no están disponibles o no corresponden al proceso.',
        step: 'Verificando los PDF guardados.',
        stage: 'finalizacion',
        group: null,
        totalGroups: null,
        details: 'Reanuda para validar y recuperar los documentos del proceso original.',
      };
      estado = {
        ...estado,
        status: 'failed',
        failure,
        failures: [...(estado.failures ?? []), failure],
        pendingFailures: [...(estado.pendingFailures ?? []), failure],
        message: failure.message,
      };
      await this.guardar(carpeta, 'execution.json', estado);
    }
    const soportesCompletos = await this.validarSoportes(carpeta, job, estado, disponibles);
    await this.retirarAnteriores(job, estado, disponibles, soportesCompletos);
    return { job, estado, carpeta, disponibles, soportesCompletos };
  }

  async consultar(id: string, propietario: PropietarioReportes) {
    await this.inicializar();
    this.programar();
    const { job, estado, disponibles, soportesCompletos } = await this.leer(id, propietario);
    return this.respuesta(job, estado, disponibles, soportesCompletos);
  }

  async consultarCola(propietario: PropietarioReportes): Promise<ColaReportes> {
    await this.inicializar();
    this.programar();
    return this.exclusivo(async () => {
      const { trabajos } = await this.ubicacion();
      const registros = this.ultimos(await this.registros(trabajos, propietario)).filter(
        ({ job }) => job.loteId && this.mismoPropietario(job.propietario, propietario)
      );
      const porOrden = (a: { job: Trabajo }, b: { job: Trabajo }) =>
        (b.job.secuenciaCola ?? 0) - (a.job.secuenciaCola ?? 0);
      const activos = registros
        .filter(({ estado }) => ['queued', 'starting', 'running'].includes(estado.status))
        .sort(porOrden);
      const loteId = (activos[0] ?? registros.sort(porOrden)[0])?.job.loteId;
      const lote = registros
        .filter(({ job }) => job.loteId === loteId)
        .sort((a, b) => (a.job.secuenciaCola ?? 0) - (b.job.secuenciaCola ?? 0));
      const lista: EjecucionReportes[] = [];
      for (const { job } of lote) {
        const { estado, disponibles, soportesCompletos } = await this.leer(job.id, propietario);
        lista.push(this.respuesta(job, estado, disponibles, soportesCompletos));
      }
      const procesados = lista.filter(
        trabajo => !['queued', 'starting', 'running'].includes(trabajo.estado)
      ).length;
      const enCurso = lista.filter(trabajo => ['starting', 'running'].includes(trabajo.estado));
      const avance = enCurso.reduce(
        (total, trabajo) =>
          total + Math.max(0, Math.min(99, trabajo.progreso?.porcentajeGeneral ?? 0)) / 100,
        0
      );
      return {
        trabajos: lista,
        totalEnCola: this.cola.length + (this.activo ? 1 : 0),
        resumen: {
          total: lista.length,
          procesados,
          enCurso: enCurso.length,
          pendientes: lista.filter(trabajo => trabajo.estado === 'queued').length,
          porcentaje: lista.length
            ? Math.min(100, Math.floor(((procesados + avance) / lista.length) * 100))
            : 0,
        },
      };
    });
  }

  async listarGenerados(
    propietario: PropietarioReportes,
    pagina = 1,
    filtros: FiltrosHistorialReportes | string = {}
  ): Promise<HistorialReportes> {
    if (!Number.isSafeInteger(pagina) || pagina < 1)
      throw new BadRequestException('La página debe ser un número entero mayor o igual a 1.');
    // Conserva las consultas genéricas anteriores; la interfaz usa criterios separados.
    const criterios: FiltrosHistorialReportes =
      typeof filtros === 'string' ? { busqueda: filtros } : filtros;
    if (!criterios || typeof criterios !== 'object' || Array.isArray(criterios))
      throw new BadRequestException('Revisa los filtros de los reportes generados.');
    for (const campo of ['documento', 'ingreso', 'proceso', 'archivo', 'busqueda'] as const)
      if (criterios[campo] !== undefined && typeof criterios[campo] !== 'string')
        throw new BadRequestException('Los filtros deben contener texto.');
    const documento = criterios.documento?.trim() ?? '';
    const ingreso = criterios.ingreso?.trim() ?? '';
    const proceso = criterios.proceso?.trim() ?? '';
    const archivo = criterios.archivo?.trim() ?? '';
    const busqueda = criterios.busqueda?.trim() ?? '';
    if ((documento && !/^\d{1,20}$/.test(documento)) || (ingreso && !/^\d{1,20}$/.test(ingreso)))
      throw new BadRequestException('La cédula y el ingreso deben contener hasta 20 dígitos.');
    if (
      proceso &&
      proceso !== 'anteriores' &&
      !PROCESOS_REPORTES.includes(proceso as ProcesoReportes)
    )
      throw new BadRequestException('Selecciona un proceso válido para filtrar.');
    if (archivo.length > 100)
      throw new BadRequestException('El nombre del archivo debe tener máximo 100 caracteres.');
    if (typeof busqueda !== 'string' || busqueda.trim().length > 100)
      throw new BadRequestException('La búsqueda debe ser un texto de máximo 100 caracteres.');
    const normalizar = (texto: string) =>
      texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const terminos = normalizar(busqueda.trim()).split(/\s+/).filter(Boolean);
    const terminosArchivo = normalizar(archivo).split(/\s+/).filter(Boolean);
    const nombresProceso: Record<ProcesoReportes, string> = {
      'pre-envio': 'Auditoría pre-envío',
      concurrente: 'Auditoría concurrente',
      conciliacion: 'Auditoría de cuentas médicas conciliación',
    };
    const porPagina = 10;
    const vacio = () => ({ reportes: [], total: 0, pagina, porPagina });
    if (proceso === 'anteriores') return vacio();
    let trabajos: string;
    try {
      ({ trabajos } = await this.ubicacion());
    } catch (error) {
      if (error instanceof ServiceUnavailableException) return vacio();
      throw error;
    }
    const terminales = ['complete', 'failed', 'prefactura-unavailable'];
    const reportes: EjecucionReportes[] = [];
    for (const { job, estado } of this.ultimos(await this.registros(trabajos, propietario))) {
      if (documento && !String(job.documento ?? '').includes(documento)) continue;
      if (ingreso && !String(job.ingreso ?? '').includes(ingreso)) continue;
      if (proceso && (job.proceso ?? 'anteriores') !== proceso) continue;
      if (!terminales.includes(estado.status)) continue;
      let contenido: Awaited<ReturnType<EjecucionesReportesImpl['leer']>>;
      try {
        contenido = await this.leer(job.id, propietario);
      } catch (error) {
        if (error instanceof NotFoundException) continue;
        throw error;
      }
      const reporte = this.respuesta(
        contenido.job,
        contenido.estado,
        contenido.disponibles,
        contenido.soportesCompletos
      );
      // Una reanudación concurrente puede cambiar a queued durante esta lectura.
      if (!terminales.includes(reporte.estado) || !reporte.archivos.length) continue;
      if (
        terminosArchivo.length &&
        !reporte.archivos.some(pdf => {
          const nombre = normalizar(pdf.nombre);
          return terminosArchivo.every(termino => nombre.includes(termino));
        })
      )
        continue;
      const texto = normalizar(
        [
          reporte.documento,
          reporte.ingreso,
          reporte.proceso ?? 'Reportes anteriores',
          reporte.proceso ? nombresProceso[reporte.proceso] : '',
          ...reporte.archivos.map(archivo => `${archivo.nombre} ${archivo.tipo}`),
        ].join(' ')
      );
      if (terminos.every(termino => texto.includes(termino))) reportes.push(reporte);
    }
    const fecha = (valor: string | undefined) => {
      const timestamp = Date.parse(valor ?? '');
      return Number.isFinite(timestamp) ? timestamp : 0;
    };
    reportes.sort(
      (a, b) =>
        (fecha(b.updatedAt) || fecha(b.createdAt)) - (fecha(a.updatedAt) || fecha(a.createdAt)) ||
        fecha(b.createdAt) - fecha(a.createdAt) ||
        b.id.localeCompare(a.id)
    );
    return {
      reportes: reportes.slice((pagina - 1) * porPagina, pagina * porPagina),
      total: reportes.length,
      pagina,
      porPagina,
    };
  }

  async listar(
    documento: string,
    ingresos: string[],
    propietario: PropietarioReportes,
    proceso: ProcesoReportes | null
  ): Promise<EjecucionReportes[]> {
    if (!ingresos.length || !proceso) return [];
    let trabajos: string;
    try {
      ({ trabajos } = await this.ubicacion());
    } catch (error) {
      if (error instanceof ServiceUnavailableException) return [];
      throw error;
    }
    const permitidos = new Set(ingresos);
    const reportes: EjecucionReportes[] = [];
    for (const { job } of this.ultimos(await this.registros(trabajos, propietario))) {
      if (job.documento !== documento || !permitidos.has(job.ingreso) || job.proceso !== proceso)
        continue;
      try {
        const contenido = await this.leer(job.id, propietario);
        reportes.push(
          this.respuesta(
            contenido.job,
            contenido.estado,
            contenido.disponibles,
            contenido.soportesCompletos
          )
        );
      } catch (error) {
        if (!(error instanceof NotFoundException)) throw error;
      }
    }
    return reportes;
  }
  private async rutaArchivo(carpeta: string, archivo: ArchivoWorker, validarIntegridad = false) {
    const ruta = await realpath(rutaArchivoPermitida(carpeta, archivo.relativePath));
    rutaArchivoPermitida(await realpath(carpeta), ruta);
    const informacion = await stat(ruta);
    if (!informacion.isFile() || !informacion.size)
      throw new NotFoundException('Archivo no disponible.');
    if (validarIntegridad) {
      if (informacion.size !== archivo.bytes || !/^[a-f0-9]{64}$/i.test(archivo.sha256 ?? ''))
        throw new NotFoundException('Archivo no disponible.');
      const cuerpo = await readFile(ruta);
      if (
        cuerpo.subarray(0, 5).toString('ascii') !== '%PDF-' ||
        createHash('sha256').update(cuerpo).digest('hex') !== archivo.sha256
      )
        throw new NotFoundException('Archivo no disponible.');
    } else {
      // Los documentos anteriores no guardaban SHA-256, pero deben seguir siendo PDF.
      const archivoAbierto = await open(ruta, 'r');
      try {
        const encabezado = Buffer.alloc(5);
        await archivoAbierto.read(encabezado, 0, 5, 0);
        if (encabezado.toString('ascii') !== '%PDF-')
          throw new NotFoundException('Archivo no disponible.');
      } finally {
        await archivoAbierto.close();
      }
    }
    return ruta;
  }

  async archivo(id: string, archivoId: string, propietario: PropietarioReportes) {
    const { carpeta, estado, job } = await this.leer(id, propietario);
    if (!/^\d{1,6}$/.test(archivoId)) throw new NotFoundException();
    const archivo = estado.files[Number(archivoId)];
    if (!archivo || (job.proceso && !DOCUMENTOS_POR_PROCESO[job.proceso].includes(archivo.kind)))
      throw new NotFoundException();
    try {
      const ruta = await this.rutaArchivo(carpeta, archivo, Boolean(job.proceso));
      return { ruta, nombre: archivo.name, bytes: (await stat(ruta)).size };
    } catch {
      throw new NotFoundException('Archivo no disponible.');
    }
  }

  async archivos(id: string, propietario: PropietarioReportes) {
    const { carpeta, estado, job } = await this.leer(id, propietario);
    const zip = new JSZip();
    const entradas: ReturnType<typeof createReadStream>[] = [];
    let disponibles = 0;
    for (const [indice, archivo] of estado.files.entries()) {
      if (
        archivo.superseded ||
        (job.proceso && !DOCUMENTOS_POR_PROCESO[job.proceso].includes(archivo.kind))
      )
        continue;
      let ruta: string;
      try {
        ruta = await this.rutaArchivo(carpeta, archivo, Boolean(job.proceso));
      } catch {
        // Ofrecer los PDF conservados, igual que en la lista del modal.
        continue;
      }
      const entrada = createReadStream(ruta);
      entradas.push(entrada);
      const tipo =
        archivo.kind === 'prefactura'
          ? 'prefactura'
          : archivo.kind === 'enfermeria'
            ? 'enfermeria'
            : archivo.kind === 'soportes-requeridos'
              ? 'soportes-requeridos'
              : 'historias-clinicas';
      zip.file(
        `${job.documento}/${job.ingreso}/${tipo}/${indice + 1}-${basename(archivo.name)}`,
        entrada
      );
      disponibles++;
    }
    if (!disponibles) throw new NotFoundException('No hay PDF disponibles para descargar.');
    const origen = zip.generateNodeStream({
      type: 'nodebuffer',
      streamFiles: true,
      compression: 'STORE',
    });
    const contenido = new PassThrough();
    const liberar = () => entradas.forEach(entrada => entrada.destroy());
    pipeline(origen, contenido, liberar);
    return {
      contenido,
      nombre: `reportes${job.proceso ? '-' + job.proceso : ''}-paciente-${job.documento}-ingreso-${job.ingreso}.zip`,
    };
  }

  onModuleDestroy() {
    this.detenido = true;
    if (this.programado) clearTimeout(this.programado);
    this.programado = undefined;
    if (this.child) this.detener(this.child);
  }
}
