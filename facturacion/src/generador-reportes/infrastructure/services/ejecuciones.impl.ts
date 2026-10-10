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
}
interface EstadoWorker {
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
    await rename(temporal, destino);
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

  async crear(documento: string, ingreso: string, propietario: PropietarioReportes) {
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
      const job: Trabajo = {
        id: randomUUID(),
        documento,
        ingreso,
        propietario,
        createdAt: new Date().toISOString(),
      };
      const destino = join(trabajos, job.id);
      await mkdir(destino);
      await this.guardar(destino, 'job.json', job);
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
      const timer = setTimeout(
        () => {
          agotado = true;
          this.detener(child);
        },
        Number.isFinite(limite) && limite > 0 ? limite : 1800000
      );
      timer.unref();
      child.once('error', () => {
        /* close guarda el fallo de arranque. */
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
              await this.guardar(destino, 'execution.json', {
                status: 'failed',
                updatedAt: new Date().toISOString(),
                files: estado?.files ?? [],
                ...(estado?.progress ? { progress: estado.progress } : {}),
                message: agotado
                  ? 'La generación superó el tiempo máximo. Puedes volver a intentarlo.'
                  : 'La ejecución se interrumpió. Revisa Node.js, el navegador y el acceso a DG Web.',
              });
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
      return this.respuesta(job, {
        status: 'starting',
        message: 'Iniciando la generación.',
        updatedAt: job.createdAt,
        files: [],
      });
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
      archivos: estado.files.map((archivo, indice) => ({
        id: String(indice),
        nombre: archivo.name,
        bytes: archivo.bytes,
        tipo: archivo.kind,
        grupo: archivo.group,
        totalGrupos: archivo.totalGroups,
      })),
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
      !procesoVivo(job.pid) &&
      (!this.child || this.child.pid !== job.pid)
    ) {
      estado = {
        ...estado,
        status: 'failed',
        message: 'La ejecución se interrumpió. Puedes volver a intentarlo.',
      };
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
      if (!reporte.archivos.length) continue;
      if (reporte.estado === 'complete' && reporte.archivos.length !== estado.files.length) {
        reporte.estado = 'failed';
        reporte.mensaje =
          'Algunos PDF guardados ya no están disponibles. Puedes consultar los archivos conservados.';
        if (reporte.progreso)
          reporte.progreso = {
            etapa: 'completo',
            completados: reporte.archivos.length,
            total: estado.files.length,
            grupoActual: null,
          };
      }
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
    return [...encontrados.values()];
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
