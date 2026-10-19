import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { spawn, ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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
  rename,
  unlink,
  writeFile,
  stat,
} from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { EjecucionReportes, ProgresoReportes } from '../../domain/ejecucion';

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
  kind: 'historias-clinicas' | 'enfermeria';
  unified?: boolean;
  pages?: number;
  superseded?: boolean;
}
interface EstadoWorker {
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
  status: 'starting' | 'running' | 'complete' | 'failed';
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
  propietario: PropietarioReportes;
  createdAt: string;
  pid?: number;
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
export class EjecucionesReportesImpl implements OnModuleDestroy {
  private child?: ChildProcess;
  private reservando = false;

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
    const { job, estado } = await this.leer(id, propietario);
    if (estado.status !== 'failed')
      throw new ConflictException('Solo puedes reanudar una ejecución que se haya detenido.');
    return this.crear(job.documento, job.ingreso, propietario, id);
  }

  async crear(
    documento: string,
    ingreso: string,
    propietario: PropietarioReportes,
    reanudarId?: string
  ) {
    if (!/^\d{1,20}$/.test(documento) || !/^\d{1,20}$/.test(ingreso)) {
      throw new BadRequestException('Revisa la cédula y el ingreso.');
    }
    const contexto = process.env.EKLIPSE_AUTOMATION_CONTEXT ?? 'ALTACENTRO';
    if (propietario.contexto !== contexto) {
      throw new BadRequestException(
        'La automatización no está configurada para la sede de tu sesión.'
      );
    }
    if (this.reservando || this.child)
      throw new ConflictException('Ya hay una generación en curso. Espera a que termine.');
    this.reservando = true;
    let bloqueo: string | undefined;
    try {
      const { carpeta, trabajos } = await this.ubicacion();
      await mkdir(trabajos, { recursive: true });
      bloqueo = await this.bloquear(trabajos);
      const anterior = reanudarId ? await this.leer(reanudarId, propietario) : undefined;
      if (anterior && anterior.estado.status !== 'failed')
        throw new ConflictException('La ejecución ya se está procesando o terminó.');
      const job: Trabajo = anterior?.job ?? {
        id: randomUUID(),
        documento,
        ingreso,
        propietario,
        createdAt: new Date().toISOString(),
      };
      const destino = join(trabajos, job.id);
      if (!anterior) await mkdir(destino);
      await this.guardar(destino, 'job.json', job);
      const inicio: EstadoWorker = {
        ...anterior?.estado,
        status: 'starting',
        updatedAt: new Date().toISOString(),
        message: anterior
          ? 'Reanudando desde el último avance guardado.'
          : 'Iniciando la generación.',
        files: anterior?.estado.files ?? [],
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
      const limite = Number(process.env.EKLIPSE_AUTOMATION_TIMEOUT_MS ?? 1800000);
      let agotado = false;
      let errorArranque: string | undefined;
      const timer = setTimeout(
        () => {
          agotado = true;
          this.detener(child);
        },
        Number.isFinite(limite) && limite > 0 ? limite : 1800000
      );
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
            if (!estado || !['complete', 'failed'].includes(estado.status)) {
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
          } finally {
            await unlink(rutaBloqueo).catch(() => {});
            if (this.child === child) this.child = undefined;
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
      return this.respuesta(job, inicio);
    } catch (error) {
      if (!this.child && bloqueo) await unlink(bloqueo).catch(() => {});
      throw error;
    } finally {
      this.reservando = false;
    }
  }

  private respuesta(job: Trabajo, estado: EstadoWorker): EjecucionReportes {
    return {
      id: job.id,
      documento: job.documento,
      ingreso: job.ingreso,
      createdAt: job.createdAt,
      estado: estado.status,
      mensaje: estado.message,
      updatedAt: estado.updatedAt,
      reanudable: estado.status === 'failed',
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
      archivos: estado.files.flatMap((archivo, indice) =>
        archivo.superseded
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
      ),
    };
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
    if (
      job.propietario.usuario !== propietario.usuario ||
      job.propietario.contexto !== propietario.contexto ||
      job.propietario.esDinamica !== propietario.esDinamica
    )
      throw new NotFoundException();
    let estado: EstadoWorker;
    try {
      estado = JSON.parse(await readFile(join(carpeta, 'execution.json'), 'utf8'));
    } catch {
      estado = {
        status: 'starting',
        message: 'Preparando el navegador.',
        updatedAt: job.createdAt,
        files: [],
      };
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
    return { job, estado, carpeta };
  }

  async consultar(id: string, propietario: PropietarioReportes) {
    const { job, estado } = await this.leer(id, propietario);
    return this.respuesta(job, estado);
  }

  async listar(
    documento: string,
    ingresos: string[],
    propietario: PropietarioReportes
  ): Promise<EjecucionReportes[]> {
    const encontrados = new Map<string, EjecucionReportes>();
    const pendientes = new Map<string, EjecucionReportes>();
    if (!ingresos.length) return [];
    let trabajos: string;
    try {
      ({ trabajos } = await this.ubicacion());
    } catch (error) {
      if (error instanceof ServiceUnavailableException) return [];
      throw error;
    }
    let carpetas;
    try {
      carpetas = await readdir(trabajos, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw new ServiceUnavailableException(
        'No fue posible consultar los reportes guardados. Intenta nuevamente.'
      );
    }
    const permitidos = new Set(ingresos);
    for (const carpeta of carpetas) {
      if (!carpeta.isDirectory() || !JOB_ID.test(carpeta.name)) continue;
      let contenido: Awaited<ReturnType<EjecucionesReportesImpl['leer']>>;
      try {
        contenido = await this.leer(carpeta.name, propietario);
      } catch (error) {
        if (error instanceof NotFoundException) continue;
        throw error;
      }
      const { job, estado } = contenido;
      if (job.documento !== documento || !permitidos.has(job.ingreso)) continue;
      const reporte = this.respuesta(job, estado);
      const disponibles = new Set<string>();
      for (const [indice, archivo] of estado.files.entries()) {
        try {
          await this.rutaArchivo(contenido.carpeta, archivo);
          disponibles.add(String(indice));
        } catch {
          /* No ofrecer archivos ausentes o fuera de esta ejecución. */
        }
      }
      reporte.archivos = reporte.archivos.filter(archivo => disponibles.has(archivo.id));
      const esperados = estado.files.filter(archivo => !archivo.superseded).length;
      if (reporte.estado === 'complete' && reporte.archivos.length !== esperados) {
        const failure = {
          occurredAt: new Date().toISOString(),
          message: 'Algunos PDF guardados ya no están disponibles.',
          step: 'Verificando los PDF guardados.',
          stage: estado.progress?.stage ?? 'finalizacion',
          group: null,
          totalGroups: null,
          details: 'Reanuda para descargar los grupos ausentes o reconstruir el PDF unificado.',
        };
        await this.guardar(contenido.carpeta, 'execution.json', {
          ...estado,
          status: 'failed',
          failure,
          failures: [...(estado.failures ?? []), failure],
          pendingFailures: [...(estado.pendingFailures ?? []), failure],
        });
        reporte.estado = 'failed';
        reporte.reanudable = true;
        reporte.fallo = {
          fecha: failure.occurredAt,
          mensaje: failure.message,
          paso: failure.step,
          etapa: failure.stage,
          grupo: null,
          totalGrupos: null,
          detalle: failure.details,
        };
        reporte.mensaje =
          'Algunos PDF guardados ya no están disponibles. Puedes consultar los archivos conservados.';
        if (reporte.progreso)
          reporte.progreso = {
            etapa: 'completo',
            completados: reporte.archivos.length,
            total: esperados,
            grupoActual: null,
          };
      }
      if (
        reporte.estado === 'failed' &&
        (!pendientes.has(job.ingreso) || pendientes.get(job.ingreso).createdAt < reporte.createdAt)
      )
        pendientes.set(job.ingreso, reporte);
      const anterior = encontrados.get(job.ingreso);
      // Una generación fallida posterior no oculta una descarga completa anterior.
      if (
        !anterior ||
        (reporte.estado === 'complete' && anterior.estado !== 'complete') ||
        ((reporte.estado === 'complete') === (anterior.estado === 'complete') &&
          reporte.createdAt > anterior.createdAt)
      ) {
        encontrados.set(job.ingreso, reporte);
      }
    }
    return [...encontrados.values()].map(reporte => {
      const pendiente = pendientes.get(reporte.ingreso);
      return pendiente && pendiente.id !== reporte.id && pendiente.createdAt > reporte.createdAt
        ? { ...reporte, pendiente }
        : reporte;
    });
  }

  private async rutaArchivo(carpeta: string, archivo: ArchivoWorker) {
    const ruta = await realpath(rutaArchivoPermitida(carpeta, archivo.relativePath));
    rutaArchivoPermitida(await realpath(carpeta), ruta);
    const informacion = await stat(ruta);
    if (!informacion.isFile() || !informacion.size)
      throw new NotFoundException('Archivo no disponible.');
    return ruta;
  }

  async archivo(id: string, archivoId: string, propietario: PropietarioReportes) {
    const { carpeta, estado } = await this.leer(id, propietario);
    if (!/^\d{1,6}$/.test(archivoId)) throw new NotFoundException();
    const archivo = estado.files[Number(archivoId)];
    if (!archivo) throw new NotFoundException();
    try {
      const ruta = await this.rutaArchivo(carpeta, archivo);
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
      if (archivo.superseded) continue;
      let ruta: string;
      try {
        ruta = await this.rutaArchivo(carpeta, archivo);
      } catch {
        // Ofrecer los PDF conservados, igual que en la lista del modal.
        continue;
      }
      const entrada = createReadStream(ruta);
      entradas.push(entrada);
      const tipo = archivo.kind === 'enfermeria' ? 'enfermeria' : 'historias-clinicas';
      zip.file(`${tipo}/${indice + 1}-${basename(archivo.name)}`, entrada);
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
      nombre: `reportes-ingreso-${job.ingreso}.zip`,
    };
  }

  onModuleDestroy() {
    if (this.child) this.detener(this.child);
  }
}
