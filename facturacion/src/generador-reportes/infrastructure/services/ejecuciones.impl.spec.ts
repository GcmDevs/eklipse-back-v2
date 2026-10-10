import { ConflictException, NotFoundException } from '@nestjs/common';
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import JSZip = require('jszip');
import { EjecucionesReportesImpl, rutaArchivoPermitida } from './ejecuciones.impl';

describe('Ejecuciones locales con proceso real y reportes sintéticos', () => {
  let carpeta: string;
  let servicio: EjecucionesReportesImpl;
  const original = { ...process.env };
  const propietario = { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true };

  beforeEach(async () => {
    carpeta = await mkdtemp(join(tmpdir(), 'eklipse-reportes-'));
    process.env.EKLIPSE_AUTOMATION_DIR = carpeta;
    delete process.env.EKLIPSE_AUTOMATION_NODE;
    delete process.env.EKLIPSE_AUTOMATION_CONTEXT;
    delete process.env.EKLIPSE_AUTOMATION_TIMEOUT_MS;
    await mkdir(join(carpeta, 'src'));
    // Este ejecutor no usa Playwright ni se conecta a DG Web.
    await writeFile(
      join(carpeta, 'src/worker.ts'),
      `
      const fs = require('node:fs/promises');
      const path = require('node:path');
      const folder = process.argv[process.argv.indexOf('--carpeta') + 1];
      const file = { name: 'grupo-001.pdf', relativePath: 'grupo-001.pdf', bytes: 15, group: 1, totalGroups: 1, kind: 'historias-clinicas' };
      (async () => {
        await fs.writeFile(path.join(folder, 'grupo-001.pdf'), '%PDF-1.7 test');
        await fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({ status: 'running', message: 'Descargando', updatedAt: new Date().toISOString(), progress: { stage: 'historias-clinicas', completed: 1, total: 1, current: 1, generalPercentage: 55 }, files: [file] }));
        setTimeout(async () => { await fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({ status: 'complete', message: 'Completo', updatedAt: new Date().toISOString(), progress: { stage: 'completo', completed: 1, total: 1, current: null, generalPercentage: 100 }, files: [file] })); }, 500);
      })();
    `
    );
    servicio = new EjecucionesReportesImpl();
  });
  afterEach(async () => {
    servicio.onModuleDestroy();
    // Esperar a que la limpieza del proceso termine antes de borrar su carpeta.
    for (let index = 0; index < 60 && (servicio as any).child; index++)
      await new Promise(resolve => setTimeout(resolve, 50));
    const destino = await realpath(carpeta);
    expect(destino.startsWith(await realpath(tmpdir()))).toBe(true);
    await rm(destino, { recursive: true, force: true });
    process.env = { ...original };
  });

  async function esperar(id: string, estado: string) {
    for (let index = 0; index < 100; index++) {
      const trabajo = await servicio.consultar(id, propietario);
      if (trabajo.estado === estado) return trabajo;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`No llegó a ${estado}`);
  }

  async function guardado(opciones: {
    documento?: string;
    ingreso?: string;
    estado?: string;
    fecha?: string;
    propietario?: typeof propietario;
    archivos?: string[];
    progreso?: {
      stage: string;
      completed: number;
      total: number | null;
      current: number | null;
      generalPercentage?: number;
    };
  }) {
    const id = randomUUID();
    const destino = join(carpeta, 'artifacts/eklipse-jobs', id);
    await mkdir(destino, { recursive: true });
    await writeFile(
      join(destino, 'job.json'),
      JSON.stringify({
        id,
        documento: opciones.documento ?? '001234',
        ingreso: opciones.ingreso ?? '20',
        propietario: opciones.propietario ?? propietario,
        createdAt: opciones.fecha ?? '2026-10-09T12:00:00Z',
      })
    );
    const archivos = opciones.archivos ?? ['grupo-001.pdf'];
    await writeFile(
      join(destino, 'execution.json'),
      JSON.stringify({
        status: opciones.estado ?? 'complete',
        message: 'Reportes guardados',
        updatedAt: '2026-10-09T12:00:00Z',
        progress: opciones.progreso,
        files: archivos.map((nombre, indice) => ({
          name: nombre,
          relativePath: nombre,
          bytes: 15,
          group: indice + 1,
          totalGroups: archivos.length,
          kind: 'historias-clinicas',
        })),
      })
    );
    for (const nombre of archivos) await writeFile(join(destino, nombre), '%PDF-1.7 test');
    return { id, destino };
  }

  it('descarga en ZIP los PDF existentes y conserva el aislamiento por usuario', async () => {
    const job = await guardado({ archivos: ['grupo-001.pdf', 'grupo-002.pdf', 'grupo-003.pdf'] });
    await rm(join(job.destino, 'grupo-003.pdf'));
    await expect(servicio.archivos(job.id, { ...propietario, usuario: 8 })).rejects.toBeInstanceOf(
      NotFoundException
    );
    const resultado = await servicio.archivos(job.id, propietario);
    const bloques: Buffer[] = [];
    for await (const bloque of resultado.contenido) bloques.push(Buffer.from(bloque));
    const zip = await JSZip.loadAsync(Buffer.concat(bloques));
    const archivos = Object.values(zip.files).filter(archivo => !archivo.dir);
    expect(resultado.nombre).toBe('reportes-ingreso-20.zip');
    expect(archivos.map(archivo => archivo.name)).toEqual([
      'historias-clinicas/1-grupo-001.pdf',
      'historias-clinicas/2-grupo-002.pdf',
    ]);
    expect(await archivos[0].async('string')).toContain('%PDF');
    await expect(
      servicio.archivos(job.id, { ...propietario, contexto: 'OTRA' })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza un ZIP sin PDF disponibles', async () => {
    const job = await guardado({ archivos: [] });
    await expect(servicio.archivos(job.id, propietario)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('conserva el avance real de una ejecución interrumpida y admite estados antiguos', async () => {
    const job = await guardado({
      estado: 'failed',
      progreso: { stage: 'enfermeria', completed: 1, total: 3, current: 2, generalPercentage: 82 },
    });
    const respuesta = await servicio.consultar(job.id, propietario);
    expect(respuesta.progreso).toEqual({
      etapa: 'enfermeria',
      completados: 1,
      total: 3,
      grupoActual: 2,
      porcentajeGeneral: 82,
    });
    const anterior = await guardado({});
    expect((await servicio.consultar(anterior.id, propietario)).progreso).toBeUndefined();
  });

  it('arranca sin terminal, bloquea duplicados, persiste el resultado y protege los archivos por usuario', async () => {
    const job = await servicio.crear('001234', '20', propietario);
    expect(job.estado).toBe('starting');
    await expect(servicio.crear('001234', '20', propietario)).rejects.toBeInstanceOf(
      ConflictException
    );
    const resultado = await esperar(job.id, 'complete');
    expect(resultado.documento).toBe('001234');
    expect(resultado.archivos.length).toBe(1);
    expect(resultado.progreso).toEqual({
      etapa: 'completo',
      completados: 1,
      total: 1,
      grupoActual: null,
      porcentajeGeneral: 100,
    });
    expect(JSON.stringify(resultado)).not.toContain(carpeta);
    const archivo = await servicio.archivo(job.id, '0', propietario);
    expect(await readFile(archivo.ruta, 'utf8')).toContain('%PDF');
    expect(archivo.bytes).toBe((await readFile(archivo.ruta)).length);
    await expect(
      servicio.archivo(job.id, '0', { ...propietario, usuario: 8 })
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      servicio.consultar(job.id, { ...propietario, contexto: 'SANJUAN' })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect((await new EjecucionesReportesImpl().consultar(job.id, propietario)).estado).toBe(
      'complete'
    );
  });

  it('rechaza sedes y rutas ajenas', async () => {
    await expect(
      servicio.crear('123', '20', { ...propietario, contexto: 'SANJUAN' })
    ).rejects.toThrow('sede');
    expect(() => rutaArchivoPermitida(carpeta, '../secreto.pdf')).toThrow(NotFoundException);
    await expect(servicio.consultar('../otro', propietario)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('recupera por paciente e ingreso solo los reportes del usuario y sede autorizados', async () => {
    const correcto = await guardado({});
    await guardado({ documento: '1234' });
    await guardado({ ingreso: '19' });
    await guardado({ propietario: { ...propietario, usuario: 8 } });
    await guardado({ propietario: { ...propietario, contexto: 'SANJUAN' } });
    await guardado({ propietario: { ...propietario, esDinamica: false } });
    const resultado = await servicio.listar('001234', ['20'], propietario);
    expect(resultado.map(reporte => reporte.id)).toEqual([correcto.id]);
    expect(resultado[0].archivos[0].id).toBe('0');
    expect(JSON.stringify(resultado)).not.toContain(carpeta);
  });

  it('prefiere la descarga completa más reciente ante una ejecución parcial posterior', async () => {
    await guardado({ fecha: '2026-10-07T12:00:00Z' });
    const reciente = await guardado({ fecha: '2026-10-08T12:00:00Z' });
    await guardado({ fecha: '2026-10-09T12:00:00Z', estado: 'failed' });
    expect((await servicio.listar('001234', ['20'], propietario))[0].id).toBe(reciente.id);
  });

  it('omite archivos borrados, conserva sus identificadores y ofrece resultados parciales', async () => {
    const job = await guardado({ archivos: ['borrado.pdf', 'conservado.pdf'] });
    await rm(join(job.destino, 'borrado.pdf'));
    const resultado = await servicio.listar('001234', ['20'], propietario);
    expect(resultado[0].estado).toBe('failed');
    expect(resultado[0].archivos.map(archivo => archivo.id)).toEqual(['1']);
    expect((await servicio.archivo(job.id, '1', propietario)).nombre).toBe('conservado.pdf');
    await rm(join(job.destino, 'conservado.pdf'));
    expect(await servicio.listar('001234', ['20'], propietario)).toEqual([]);
  });

  it('devuelve una búsqueda vacía cuando todavía no se han guardado reportes', async () => {
    expect(await servicio.listar('001234', ['20'], propietario)).toEqual([]);
  });

  it('registra un ejecutable inexistente como fallo y libera el bloqueo', async () => {
    process.env.EKLIPSE_AUTOMATION_NODE = join(carpeta, 'no-existe.exe');
    const job = await servicio.crear('123', '20', propietario);
    const resultado = await esperar(job.id, 'failed');
    expect(resultado.archivos).toEqual([]);
    for (let index = 0; index < 40 && (servicio as any).child; index++)
      await new Promise(resolve => setTimeout(resolve, 50));
    delete process.env.EKLIPSE_AUTOMATION_NODE;
    expect((await servicio.crear('123', '20', propietario)).estado).toBe('starting');
  });

  it('termina un proceso que excede el límite y conserva sus archivos parciales', async () => {
    await writeFile(
      join(carpeta, 'src/worker.ts'),
      `
      const fs = require('node:fs/promises');
      const path = require('node:path');
      const folder = process.argv[process.argv.indexOf('--carpeta') + 1];
      (async () => {
        await fs.writeFile(path.join(folder, 'grupo-001.pdf'), '%PDF-1.7 test');
        await fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({
          status: 'running', message: 'En proceso', updatedAt: new Date().toISOString(),
          progress: { stage: 'historias-clinicas', completed: 1, total: 2, current: 2, generalPercentage: 40 },
          files: [{ name: 'grupo-001.pdf', relativePath: 'grupo-001.pdf', bytes: 15, group: 1, totalGroups: 2, kind: 'historias-clinicas' }]
        }));
        setInterval(() => {}, 1000);
      })();
    `
    );
    process.env.EKLIPSE_AUTOMATION_TIMEOUT_MS = '1500';
    const job = await servicio.crear('123', '20', propietario);
    const resultado = await esperar(job.id, 'failed');
    expect(resultado.mensaje).toContain('tiempo máximo');
    expect(resultado.progreso?.porcentajeGeneral).toBe(40);
    expect(resultado.archivos.length).toBe(1);
    expect((await servicio.archivo(job.id, '0', propietario)).nombre).toBe('grupo-001.pdf');
  });
});
