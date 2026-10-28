import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawn, ChildProcess } from 'node:child_process';
import JSZip = require('jszip');
import { EjecucionesReportesImpl, rutaArchivoPermitida } from './ejecuciones.impl';
import { ProcesoReportes } from '../../domain/proceso';

jest.mock('./consulta-cola.impl', () => ({ ConsultaColaReportesImpl: class {} }));

describe('Ejecuciones locales con proceso real y reportes sintéticos', () => {
  let carpeta: string;
  let servicio: EjecucionesReportesImpl;
  let consultaClinica: { consultar: jest.Mock };
  let procesosExternos: ChildProcess[];
  let ordenGuardado: number;
  const original = { ...process.env };
  const propietario = { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true };

  beforeEach(async () => {
    procesosExternos = [];
    ordenGuardado = 0;
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
      const proceso = process.argv[process.argv.indexOf('--proceso') + 1];
      const file = { name: 'grupo-001.pdf', relativePath: 'grupo-001.pdf', bytes: 13, sha256: require('node:crypto').createHash('sha256').update('%PDF-1.7 test').digest('hex'), group: 1, totalGroups: 1, kind: 'historias-clinicas' };
      (async () => {
        await fs.writeFile(path.join(folder, 'grupo-001.pdf'), '%PDF-1.7 test');
        await fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({ process: proceso, completedStages: [], status: 'running', message: 'Descargando', updatedAt: new Date().toISOString(), progress: { stage: 'historias-clinicas', completed: 1, total: 1, current: 1, generalPercentage: 55 }, files: [file] }));
        setTimeout(async () => { await fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({ process: proceso, completedStages: ['historias-clinicas'], status: 'complete', message: 'Completo', updatedAt: new Date().toISOString(), progress: { stage: 'completo', completed: 1, total: 1, current: null, generalPercentage: 100 }, files: [file] })); }, 500);
      })();
    `
    );
    consultaClinica = {
      consultar: jest.fn(async (documento: string) => ({
        paciente: { documento },
        ingresos: [20, 21, 22, 23].map(consecutivo => ({
          consecutivo,
          estado: 'Registrado',
          activo: true,
          tipoIngreso: 'Urgencias',
        })),
      })),
    };
    servicio = new EjecucionesReportesImpl(consultaClinica as any);
  });
  afterEach(async () => {
    servicio.onModuleDestroy();
    procesosExternos.forEach(proceso => {
      if (proceso.exitCode === null) proceso.kill();
    });
    // Esperar a que la limpieza del proceso termine antes de borrar su carpeta.
    for (let index = 0; index < 60 && (servicio as any).child; index++)
      await new Promise(resolve => setTimeout(resolve, 50));
    await (servicio as any).mutex;
    const destino = await realpath(carpeta);
    expect(destino.startsWith(await realpath(tmpdir()))).toBe(true);
    await rm(destino, { recursive: true, force: true });
    process.env = { ...original };
  });

  async function esperar(id: string, estado: string, dueno = propietario) {
    for (let index = 0; index < 100; index++) {
      const trabajo = await servicio.consultar(id, dueno);
      if (trabajo.estado === estado) return trabajo;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`No llegó a ${estado}`);
  }

  async function guardado(opciones: {
    proceso?: ProcesoReportes;
    legacy?: boolean;
    etapas?: Array<'historias-clinicas' | 'enfermeria' | 'prefactura' | 'soportes-requeridos'>;
    tipos?: Array<'historias-clinicas' | 'enfermeria' | 'prefactura' | 'soportes-requeridos'>;
    soportes?: boolean;
    documento?: string;
    ingreso?: string;
    estado?: string;
    fecha?: string;
    actualizacion?: string;
    loteId?: string;
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
    const proceso = opciones.legacy ? undefined : (opciones.proceso ?? 'pre-envio');
    const destino = join(carpeta, 'artifacts/eklipse-jobs', id);
    await mkdir(destino, { recursive: true });
    await writeFile(
      join(destino, 'job.json'),
      JSON.stringify({
        id,
        documento: opciones.documento ?? '001234',
        ingreso: opciones.ingreso ?? '20',
        proceso,
        secuenciaCola: ++ordenGuardado,
        loteId: opciones.loteId,
        propietario: opciones.propietario ?? propietario,
        createdAt: opciones.fecha ?? '2026-10-09T12:00:00Z',
      })
    );
    const archivos = opciones.archivos ?? ['grupo-001.pdf'];
    await writeFile(
      join(destino, 'execution.json'),
      JSON.stringify({
        status: opciones.estado ?? 'complete',
        process: proceso,
        completedStages: opciones.etapas ?? (proceso ? ['historias-clinicas'] : undefined),
        message: 'Reportes guardados',
        updatedAt: opciones.actualizacion ?? '2026-10-09T12:00:00Z',
        progress: opciones.progreso,
        files: archivos.map((nombre, indice) => ({
          name: nombre,
          relativePath: nombre,
          bytes: 13,
          sha256: createHash('sha256').update('%PDF-1.7 test').digest('hex'),
          group: opciones.tipos ? 1 : indice + 1,
          totalGroups: opciones.tipos ? 1 : archivos.length,
          kind: opciones.tipos?.[indice] ?? 'historias-clinicas',
        })),
      })
    );
    for (const nombre of archivos) await writeFile(join(destino, nombre), '%PDF-1.7 test');
    if (opciones.soportes !== false && ['pre-envio', 'conciliacion'].includes(proceso)) {
      const manifestFolder = join(
        destino,
        'reportes',
        opciones.documento ?? '001234',
        opciones.ingreso ?? '20',
        'soportes'
      );
      await mkdir(manifestFolder, { recursive: true });
      const manifest = {
        admission: opciones.ingreso ?? '20',
        status: 'complete',
        supports: [
          {
            plan: 'Plan sintético',
            requirement: 'Sin adjuntos',
            quantity: 0,
            status: 'skipped',
            files: [],
          },
        ],
      };
      const body = JSON.stringify(manifest);
      await writeFile(join(manifestFolder, 'manifest.json'), body);
      const rutaEstado = join(destino, 'execution.json');
      const state = JSON.parse(await readFile(rutaEstado, 'utf8'));
      state.completedStages = [...(state.completedStages ?? []), 'soportes-requeridos'];
      state.supportManifest = {
        relativePath: join(
          'reportes',
          opciones.documento ?? '001234',
          opciones.ingreso ?? '20',
          'soportes',
          'manifest.json'
        ),
        sha256: createHash('sha256').update(body).digest('hex'),
      };
      await writeFile(rutaEstado, JSON.stringify(state));
    }
    return { id, destino };
  }

  async function esperarCierre() {
    for (let i = 0; i < 100 && (servicio as any).child; i++)
      await new Promise(resolve => setTimeout(resolve, 30));
    expect((servicio as any).child).toBeUndefined();
    await (servicio as any).mutex;
  }

  async function cambiarManifestSoportes(
    job: { destino: string },
    cambiar: (manifest: any, state: any) => void
  ) {
    const rutaEstado = join(job.destino, 'execution.json');
    const state = JSON.parse(await readFile(rutaEstado, 'utf8'));
    const rutaManifest = join(job.destino, state.supportManifest.relativePath);
    const manifest = JSON.parse(await readFile(rutaManifest, 'utf8'));
    cambiar(manifest, state);
    const body = JSON.stringify(manifest);
    await writeFile(rutaManifest, body);
    state.supportManifest.sha256 = createHash('sha256').update(body).digest('hex');
    await writeFile(rutaEstado, JSON.stringify(state));
  }

  async function preenvio(opciones: { soportes?: boolean } = {}) {
    return guardado({
      proceso: 'pre-envio',
      archivos: ['historia.pdf', 'notas.pdf', 'prefactura.pdf'],
      tipos: ['historias-clinicas', 'enfermeria', 'prefactura'],
      etapas: ['historias-clinicas', 'enfermeria', 'prefactura'],
      ...opciones,
    });
  }

  it('acepta soportes sin adjuntos solo con etapa completa y manifiesto válido, sin crear un PDF ficticio', async () => {
    const job = await preenvio();
    expect(await servicio.consultar(job.id, propietario)).toMatchObject({
      disponibleParaProceso: true,
      documentosPendientes: [],
      reanudable: false,
    });
    expect((await servicio.consultar(job.id, propietario)).archivos).toHaveLength(3);
    const sinEvidencia = await preenvio({ soportes: false });
    expect(await servicio.consultar(sinEvidencia.id, propietario)).toMatchObject({
      estado: 'complete',
      disponibleParaProceso: false,
      documentosPendientes: ['soportes-requeridos'],
      reanudable: true,
    });
  });

  it.each([
    'checksum',
    'ingreso',
    'estado',
    'vacío',
    'cantidad',
    'sin etapa',
    'ruta',
    'cero con archivos',
  ] as const)('rechaza evidencia inválida de soportes: %s', async modo => {
    const job = await preenvio();
    expect((await servicio.consultar(job.id, propietario)).disponibleParaProceso).toBe(true);
    if (modo === 'checksum') {
      const state = JSON.parse(await readFile(join(job.destino, 'execution.json'), 'utf8'));
      await writeFile(join(job.destino, state.supportManifest.relativePath), '{}');
    } else
      await cambiarManifestSoportes(job, (manifest, state) => {
        if (modo === 'ingreso') manifest.admission = '999';
        if (modo === 'estado') manifest.status = 'failed';
        if (modo === 'vacío') manifest.supports = [];
        if (modo === 'cantidad') {
          manifest.supports[0].quantity = 1;
          manifest.supports[0].status = 'downloaded';
        }
        if (modo === 'sin etapa')
          state.completedStages = state.completedStages.filter(
            stage => stage !== 'soportes-requeridos'
          );
        if (modo === 'ruta') state.supportManifest.relativePath = '../manifest-ajeno.json';
        if (modo === 'cero con archivos')
          manifest.supports[0].files = [{ file: 'soporte-001-adjunto-001.pdf' }];
      });
    expect(await servicio.consultar(job.id, propietario)).toMatchObject({
      disponibleParaProceso: false,
      documentosPendientes: ['soportes-requeridos'],
      reanudable: true,
    });
    expect((await servicio.consultar(job.id, propietario)).archivos).toHaveLength(3);
  });

  it('publica el PDF de soportes unificado en listado, filtros y ZIP conservando sus originales', async () => {
    const job = await preenvio();
    const state = JSON.parse(await readFile(join(job.destino, 'execution.json'), 'utf8'));
    const relativeFolder = join('reportes', '001234', '20', 'soportes-requeridos', 'soportes');
    await mkdir(join(job.destino, relativeFolder), { recursive: true });
    await writeFile(
      join(job.destino, relativeFolder, 'manifest.json'),
      await readFile(join(job.destino, state.supportManifest.relativePath))
    );
    state.supportManifest.relativePath = join(relativeFolder, 'manifest.json');
    const body = '%PDF-1.7 test';
    const sha256 = createHash('sha256').update(body).digest('hex');
    await writeFile(join(job.destino, relativeFolder, 'soportes-unificado.pdf'), body);
    const originals = ['soporte-001-adjunto-001.pdf', 'soporte-001-adjunto-002.pdf'];
    for (const file of originals) await writeFile(join(job.destino, relativeFolder, file), body);
    state.files.push({
      name: 'soportes-unificado.pdf',
      relativePath: join(relativeFolder, 'soportes-unificado.pdf'),
      bytes: Buffer.byteLength(body),
      sha256,
      group: 1,
      totalGroups: 2,
      kind: 'soportes-requeridos',
      unified: true,
      pages: 2,
    });
    for (const [index, file] of originals.entries())
      state.files.push({
        name: file,
        relativePath: join(relativeFolder, file),
        bytes: Buffer.byteLength(body),
        sha256,
        group: index + 1,
        totalGroups: 2,
        kind: 'soportes-requeridos',
        superseded: true,
      });
    await writeFile(join(job.destino, 'execution.json'), JSON.stringify(state));
    await cambiarManifestSoportes(job, manifest => {
      manifest.supports = [
        {
          plan: 'Plan sintético',
          requirement: 'Autorización',
          quantity: 2,
          status: 'downloaded',
          files: originals.map(file => ({
            attachment: file,
            file,
            sha256,
            size: Buffer.byteLength(body),
            pages: 1,
          })),
        },
      ];
      manifest.unified = {
        file: 'soportes-unificado.pdf',
        sha256,
        size: Buffer.byteLength(body),
        pages: 2,
        savedAt: new Date().toISOString(),
      };
    });
    const result = await servicio.consultar(job.id, propietario);
    expect(result).toMatchObject({ disponibleParaProceso: true, documentosPendientes: [] });
    expect(result.archivos.filter(file => file.tipo === 'soportes-requeridos')).toEqual([
      expect.objectContaining({
        id: '3',
        nombre: 'soportes-unificado.pdf',
        unificado: true,
        paginas: 2,
      }),
    ]);
    expect((await servicio.archivo(job.id, '4', propietario)).nombre).toBe(originals[0]);
    const historial = await servicio.listarGenerados(propietario, 1, { archivo: 'soportes' });
    expect(historial.reportes.map(file => file.id)).toEqual([job.id]);
    const resultado = await servicio.archivos(job.id, propietario);
    const bloques: Buffer[] = [];
    for await (const bloque of resultado.contenido) bloques.push(Buffer.from(bloque));
    const zip = await JSZip.loadAsync(Buffer.concat(bloques));
    expect(zip.file('001234/20/soportes-requeridos/4-soportes-unificado.pdf')).not.toBeNull();
    expect(Object.keys(zip.files).some(file => file.includes('soporte-001-adjunto'))).toBe(false);
    await cambiarManifestSoportes(job, manifest => {
      manifest.unified.pages = 1;
    });
    expect((await servicio.consultar(job.id, propietario)).documentosPendientes).toEqual([
      'soportes-requeridos',
    ]);
  });

  it('reanuda una extracción completa sin soportes y no reintenta automáticamente la factura pendiente', async () => {
    const job = await preenvio({ soportes: false });
    const resumed = await servicio.reanudar(job.id, propietario);
    expect(resumed).toMatchObject({ id: job.id, estado: 'queued' });
    expect(await readFile(join(job.destino, 'historia.pdf'), 'utf8')).toContain('%PDF');
    await esperar(job.id, 'complete');
    await esperarCierre();
    const conciliacion = await guardado({
      proceso: 'conciliacion',
      archivos: ['historia.pdf', 'notas.pdf'],
      tipos: ['historias-clinicas', 'enfermeria'],
      etapas: ['historias-clinicas', 'enfermeria'],
    });
    expect(await servicio.consultar(conciliacion.id, propietario)).toMatchObject({
      documentosPendientes: ['factura'],
      reanudable: false,
    });
    await expect(servicio.reanudar(conciliacion.id, propietario)).rejects.toBeInstanceOf(
      ConflictException
    );
  });

  it('actualiza el tipo de ingreso real al comenzar el turno y lo pasa explícito al worker', async () => {
    consultaClinica.consultar.mockImplementation(async documento => ({
      paciente: { documento },
      ingresos: [
        {
          consecutivo: 20,
          estado: 'Registrado',
          activo: true,
          tipoIngreso: 'Hospitalización de Urgencias',
        },
      ],
    }));
    await writeFile(
      join(carpeta, 'src/worker.ts'),
      `
      const fs = require('node:fs/promises'), path = require('node:path');
      const folder = process.argv[process.argv.indexOf('--carpeta') + 1];
      fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({ process: 'concurrente', completedStages: [], status: 'complete', files: [], message: process.argv[process.argv.indexOf('--tipo-ingreso') + 1], updatedAt: new Date().toISOString() }));
    `
    );
    const job = await servicio.crear(
      '001234',
      '20',
      propietario,
      'concurrente',
      undefined,
      'Consulta Externa'
    );
    expect((await esperar(job.id, 'complete')).mensaje).toBe('Hospitalización de Urgencias');
    expect(
      JSON.parse(
        await readFile(join(carpeta, 'artifacts/eklipse-jobs', job.id, 'job.json'), 'utf8')
      ).tipoIngreso
    ).toBe('Hospitalización de Urgencias');
  });

  it('el historial muestra vigentes propios con PDF y oculta legacy sin tocar la cola', async () => {
    const anterior = await guardado({
      legacy: true,
      archivos: ['historia.pdf', 'notas.pdf', 'prefactura.pdf'],
      tipos: ['historias-clinicas', 'enfermeria', 'prefactura'],
      actualizacion: '2026-10-08T12:00:00Z',
    });
    const completo = await guardado({
      proceso: 'concurrente',
      documento: '005678',
      loteId: randomUUID(),
      actualizacion: '2026-10-10T12:00:00Z',
    });
    const parcial = await guardado({
      proceso: 'conciliacion',
      estado: 'failed',
      loteId: randomUUID(),
      actualizacion: '2026-10-11T12:00:00Z',
    });
    const sinPrefactura = await guardado({
      proceso: 'pre-envio',
      ingreso: '21',
      estado: 'prefactura-unavailable',
      actualizacion: '2026-10-09T12:00:00Z',
    });
    await guardado({ propietario: { ...propietario, usuario: 8 } });
    await guardado({ propietario: { ...propietario, contexto: 'SANJUAN' } });
    await guardado({ propietario: { ...propietario, esDinamica: false } });
    await guardado({ estado: 'failed', archivos: [], ingreso: '22' });
    const activos = [];
    for (const [index, estado] of ['queued', 'starting', 'running'].entries())
      activos.push(await guardado({ proceso: 'concurrente', estado, ingreso: String(30 + index) }));
    const inicializar = jest.spyOn(servicio as any, 'inicializar');
    const programar = jest.spyOn(servicio as any, 'programar');
    const historial = await servicio.listarGenerados(propietario);
    expect(historial).toMatchObject({ total: 3, pagina: 1, porPagina: 10 });
    expect(historial.reportes.map(reporte => reporte.id)).toEqual([
      parcial.id,
      completo.id,
      sinPrefactura.id,
    ]);
    expect(historial.reportes.some(reporte => reporte.id === anterior.id)).toBe(false);
    expect(inicializar).not.toHaveBeenCalled();
    expect(programar).not.toHaveBeenCalled();
    expect(consultaClinica.consultar).not.toHaveBeenCalled();
    await expect(
      readFile(join(carpeta, 'artifacts/eklipse-jobs/queue.json'))
    ).rejects.toMatchObject({ code: 'ENOENT' });
    for (let i = 0; i < activos.length; i++)
      expect(
        JSON.parse(await readFile(join(activos[i].destino, 'execution.json'), 'utf8')).status
      ).toBe(['queued', 'starting', 'running'][i]);
  });

  it('pagina los reportes generados propios de diez en diez después de descartar los que no tienen PDF', async () => {
    const guardados = [];
    for (let i = 0; i < 23; i++)
      guardados.push(
        await guardado({
          proceso: i % 2 ? 'concurrente' : undefined,
          ingreso: String(100 + i),
          actualizacion: new Date(Date.UTC(2026, 9, 27, 0, i)).toISOString(),
        })
      );
    await guardado({ archivos: [], actualizacion: '2026-10-28T00:00:00Z' });
    await guardado({
      propietario: { ...propietario, usuario: 8 },
      actualizacion: '2026-10-28T00:00:00Z',
    });
    const primero = await servicio.listarGenerados(propietario);
    const segundo = await servicio.listarGenerados(propietario, 2);
    const tercero = await servicio.listarGenerados(propietario, 3);
    const vacio = await servicio.listarGenerados(propietario, 4);
    const ordenados = guardados.map(reporte => reporte.id).reverse();
    expect(primero).toMatchObject({ total: 23, pagina: 1, porPagina: 10 });
    expect(primero.reportes.map(reporte => reporte.id)).toEqual(ordenados.slice(0, 10));
    expect(segundo).toMatchObject({ total: 23, pagina: 2, porPagina: 10 });
    expect(segundo.reportes.map(reporte => reporte.id)).toEqual(ordenados.slice(10, 20));
    expect(tercero).toMatchObject({ total: 23, pagina: 3, porPagina: 10 });
    expect(tercero.reportes.map(reporte => reporte.id)).toEqual(ordenados.slice(20));
    expect(vacio).toEqual({ reportes: [], total: 23, pagina: 4, porPagina: 10 });
  });

  it('busca en todos los resultados propios antes de paginar y conserva el límite de diez', async () => {
    const coincidentes = [];
    for (let i = 0; i < 12; i++) {
      const job = await guardado({
        documento: i < 11 ? '001234' : '009999',
        ingreso: String(1000 + i),
        actualizacion: new Date(Date.UTC(2026, 9, 27, 0, i)).toISOString(),
      });
      if (i < 11) coincidentes.push(job.id);
    }
    await guardado({ documento: '001234', propietario: { ...propietario, usuario: 8 } });
    const primero = await servicio.listarGenerados(propietario, 1, ' 001234 ');
    const segundo = await servicio.listarGenerados(propietario, 2, '001234');
    expect(primero).toMatchObject({ total: 11, porPagina: 10, pagina: 1 });
    expect(primero.reportes.map(reporte => reporte.id)).toEqual(coincidentes.slice(1).reverse());
    expect(segundo).toMatchObject({ total: 11, porPagina: 10, pagina: 2 });
    expect(segundo.reportes.map(reporte => reporte.id)).toEqual([coincidentes[0]]);
    expect(
      (await servicio.listarGenerados(propietario, 1, '1000')).reportes.map(reporte => reporte.id)
    ).toEqual([coincidentes[0]]);
    expect((await servicio.listarGenerados(propietario, 1, 'sin coincidencias')).total).toBe(0);
    expect((await servicio.listarGenerados(propietario, 1, '   ')).total).toBe(12);
  });

  it('busca por proceso y archivo sin distinguir mayúsculas o tildes y admite palabras combinadas', async () => {
    const cuenta = await guardado({ proceso: 'conciliacion', archivos: ['NOTAS-ENFERMERÍA.pdf'] });
    await guardado({ documento: '009999', archivos: ['HC-antigua.pdf'], legacy: true });
    for (const busqueda of [
      'CONCILIACIÓN',
      'cuentas MÉDICAS',
      'notas enfermeria',
      '001234 conciliacion enfermería',
    ]) {
      expect(
        (await servicio.listarGenerados(propietario, 1, busqueda)).reportes.map(
          reporte => reporte.id
        )
      ).toEqual([cuenta.id]);
    }
    expect(
      (await servicio.listarGenerados(propietario, 1, 'anteriores antigua')).reportes.map(
        reporte => reporte.id
      )
    ).toEqual([]);
  });

  it('combina filtros independientes con coincidencias parciales y proceso exacto en el historial propio', async () => {
    const cuenta = await guardado({
      documento: '001234',
      ingreso: '00921160',
      proceso: 'conciliacion',
      archivos: ['HC.pdf', 'NOTAS-ENFERMERÍA.pdf'],
    });
    await guardado({
      documento: '009999',
      ingreso: '00921160',
      proceso: 'conciliacion',
      archivos: ['NOTAS-ENFERMERÍA.pdf'],
    });
    const concurrente = await guardado({
      documento: '001234',
      ingreso: '00921161',
      proceso: 'concurrente',
      archivos: ['HC.pdf'],
    });
    const anterior = await guardado({
      legacy: true,
      documento: '001234',
      ingreso: '00921160',
      archivos: ['HC-antigua.pdf'],
    });
    await guardado({
      documento: '001234',
      ingreso: '00921160',
      proceso: 'conciliacion',
      archivos: ['NOTAS-ENFERMERÍA.pdf'],
      propietario: { ...propietario, usuario: 8 },
    });
    expect(
      (
        await servicio.listarGenerados(propietario, 1, {
          documento: ' 0012 ',
          ingreso: ' 1160 ',
          proceso: 'conciliacion',
          archivo: ' notas ENFERMERIA ',
        })
      ).reportes.map(reporte => reporte.id)
    ).toEqual([cuenta.id]);
    expect(
      (await servicio.listarGenerados(propietario, 1, { proceso: 'anteriores' })).reportes.map(
        reporte => reporte.id
      )
    ).toEqual([]);
    expect(
      (
        await servicio.listarGenerados(propietario, 1, {
          documento: '001234',
          proceso: 'concurrente',
        })
      ).reportes.map(reporte => reporte.id)
    ).toEqual([concurrente.id]);
    expect(
      (
        await servicio.listarGenerados(propietario, 1, {
          proceso: 'conciliacion',
          archivo: 'hc notas',
        })
      ).total
    ).toBe(0);
    expect((await servicio.listarGenerados(propietario, 1, {})).total).toBe(3);
  });

  it('aplica los filtros por campo antes de paginar todos los resultados', async () => {
    for (let i = 0; i < 12; i++)
      await guardado({
        documento: '001234',
        ingreso: String(1000 + i),
        proceso: 'concurrente',
        archivos: ['HC.pdf'],
      });
    await guardado({ documento: '009999', proceso: 'concurrente', archivos: ['HC.pdf'] });
    const filtros = { documento: '001234', proceso: 'concurrente' as const, archivo: 'HC' };
    const primero = await servicio.listarGenerados(propietario, 1, filtros);
    const segundo = await servicio.listarGenerados(propietario, 2, filtros);
    expect(primero).toMatchObject({ total: 12, porPagina: 10, pagina: 1 });
    expect(primero.reportes).toHaveLength(10);
    expect(segundo).toMatchObject({ total: 12, porPagina: 10, pagina: 2 });
    expect(segundo.reportes).toHaveLength(2);
    expect(
      new Set([...primero.reportes, ...segundo.reportes].map(reporte => reporte.id)).size
    ).toBe(12);
  });

  it.each([
    null,
    123,
    ['001234'],
    { archivo: 123 },
    'x'.repeat(101),
    { documento: 'abc' },
    { ingreso: '1'.repeat(21) },
    { proceso: 'invalido' },
    { archivo: 'x'.repeat(101) },
  ])('rechaza búsqueda inválida %p antes de acceder a archivos', async busqueda => {
    const ubicacion = jest.spyOn(servicio as any, 'ubicacion');
    await expect(
      servicio.listarGenerados(propietario, 1, busqueda as string)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ubicacion).not.toHaveBeenCalled();
  });

  it('el historial excluye PDF ausentes o alterados, conserva los válidos y no inspecciona archivos ajenos', async () => {
    const parcial = await guardado({
      proceso: 'concurrente',
      archivos: ['borrado.pdf', 'conservado.pdf'],
    });
    const borrado = await guardado({ proceso: 'concurrente', ingreso: '21' });
    const alterado = await guardado({ proceso: 'concurrente', ingreso: '22' });
    const legadoInvalido = await guardado({ legacy: true });
    const ajeno = await guardado({
      proceso: 'concurrente',
      propietario: { ...propietario, usuario: 8 },
    });
    await rm(join(parcial.destino, 'borrado.pdf'));
    await rm(join(borrado.destino, 'grupo-001.pdf'));
    await writeFile(join(alterado.destino, 'grupo-001.pdf'), '%PDF-1.7 fake');
    await writeFile(join(legadoInvalido.destino, 'grupo-001.pdf'), '<html>No es un PDF</html>');
    await rm(join(ajeno.destino, 'grupo-001.pdf'));
    const leer = jest.spyOn(servicio as any, 'leer');
    const historial = await servicio.listarGenerados(propietario);
    expect(historial.total).toBe(1);
    expect((await servicio.listarGenerados(propietario, 1, 'borrado.pdf')).total).toBe(0);
    expect((await servicio.listarGenerados(propietario, 1, 'conservado.pdf')).total).toBe(1);
    expect(historial.reportes[0]).toMatchObject({
      id: parcial.id,
      estado: 'failed',
      disponibleParaProceso: false,
      archivos: [{ id: '1', nombre: 'conservado.pdf' }],
    });
    expect(leer.mock.calls.map(([id]) => id)).not.toContain(ajeno.id);
    expect(JSON.parse(await readFile(join(ajeno.destino, 'execution.json'), 'utf8')).status).toBe(
      'complete'
    );
    expect((await servicio.archivo(parcial.id, '1', propietario)).nombre).toBe('conservado.pdf');
    await expect(servicio.archivo(legadoInvalido.id, '0', propietario)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('ordena el historial con fecha de creación cuando updatedAt no existe y mantiene un desempate estable', async () => {
    const antiguo = await guardado({
      ingreso: '20',
      actualizacion: 'sin fecha',
      fecha: '2026-10-08T00:00:00Z',
    });
    const reciente = await guardado({
      ingreso: '21',
      actualizacion: 'sin fecha',
      fecha: '2026-10-10T00:00:00Z',
    });
    const empate = await guardado({
      ingreso: '22',
      actualizacion: 'sin fecha',
      fecha: '2026-10-10T00:00:00Z',
    });
    const esperado = [reciente.id, empate.id].sort((a, b) => b.localeCompare(a)).concat(antiguo.id);
    expect(
      (await servicio.listarGenerados(propietario)).reportes.map(reporte => reporte.id)
    ).toEqual(esperado);
    expect(
      (await servicio.listarGenerados(propietario)).reportes.map(reporte => reporte.id)
    ).toEqual(esperado);
  });

  it.each([0, -1, 1.5, NaN, Infinity, '2'])(
    'rechaza página inválida de generados %p antes de consultar archivos',
    async pagina => {
      const ubicacion = jest.spyOn(servicio as any, 'ubicacion');
      await expect(servicio.listarGenerados(propietario, pagina as number)).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(ubicacion).not.toHaveBeenCalled();
    }
  );

  it('devuelve historial vacío cuando todavía no hay reportes guardados', async () => {
    expect(await servicio.listarGenerados(propietario)).toEqual({
      reportes: [],
      total: 0,
      pagina: 1,
      porPagina: 10,
    });
    expect(await servicio.listarGenerados({ ...propietario, usuario: 8 }, 2)).toEqual({
      reportes: [],
      total: 0,
      pagina: 2,
      porPagina: 10,
    });
  });

  it('encola diferentes pacientes en FIFO y muestra el puesto global sin exponer trabajos de otro usuario', async () => {
    const primero = await servicio.crear('001234', '20', propietario, 'concurrente');
    await esperar(primero.id, 'running');
    const otroUsuario = { ...propietario, usuario: 8 };
    const ajeno = await servicio.crear('009999', '20', otroUsuario, 'concurrente');
    const segundo = await servicio.crear('005678', '21', propietario, 'concurrente');
    expect(ajeno.posicionCola).toBe(2);
    expect(segundo).toMatchObject({ estado: 'queued', posicionCola: 3, loteId: primero.loteId });
    const vista = await servicio.consultarCola(propietario);
    expect(vista.trabajos.map(trabajo => trabajo.id)).toEqual([primero.id, segundo.id]);
    expect(vista.totalEnCola).toBe(3);
    expect(vista.resumen).toMatchObject({ total: 2, procesados: 0, enCurso: 1, pendientes: 1 });
    expect(vista.resumen.porcentaje).toBeGreaterThan(0);
    expect(vista.resumen.porcentaje).toBeLessThan(50);
    expect(JSON.stringify(vista)).not.toContain('009999');
    const vistaAjena = await servicio.consultarCola(otroUsuario);
    expect(vistaAjena.trabajos.map(trabajo => trabajo.id)).toEqual([ajeno.id]);
    expect(vistaAjena.trabajos[0].posicionCola).toBe(2);
    await esperar(primero.id, 'complete');
    await esperar(ajeno.id, 'running', otroUsuario);
    expect((await servicio.consultar(segundo.id, propietario)).posicionCola).toBe(2);
    await esperar(segundo.id, 'complete');
    const final = await servicio.consultarCola(propietario);
    expect(final.resumen).toMatchObject({
      total: 2,
      procesados: 2,
      pendientes: 0,
      enCurso: 0,
      porcentaje: 100,
    });
  });

  it('deduplica solicitudes simultáneas y abre otro lote cuando el anterior terminó', async () => {
    const solicitudes = await Promise.all(
      Array.from({ length: 5 }, () => servicio.crear('001234', '20', propietario, 'concurrente'))
    );
    expect(new Set(solicitudes.map(trabajo => trabajo.id)).size).toBe(1);
    expect((await servicio.consultarCola(propietario)).trabajos).toHaveLength(1);
    await esperar(solicitudes[0].id, 'complete');
    await esperarCierre();
    const siguiente = await servicio.crear('005678', '21', propietario, 'concurrente');
    expect(siguiente.loteId).not.toBe(solicitudes[0].loteId);
    expect((await servicio.consultarCola(propietario)).trabajos.map(job => job.id)).toEqual([
      siguiente.id,
    ]);
  });

  it('continúa automáticamente tras falla y prefactura ausente sin esperar seguimiento del navegador', async () => {
    await writeFile(
      join(carpeta, 'src/worker.ts'),
      `
      const fs=require('node:fs/promises'),path=require('node:path');
      const folder=process.argv[process.argv.indexOf('--carpeta')+1], ingreso=process.argv[process.argv.indexOf('--ingreso')+1], processName=process.argv[process.argv.indexOf('--proceso')+1];
      (async()=>{ const status=ingreso==='20'?'failed':ingreso==='21'?'prefactura-unavailable':'complete';
        await fs.appendFile(path.join(folder,'..','orden.txt'),ingreso+'\\n');
        await fs.writeFile(path.join(folder,'execution.json'),JSON.stringify({process:processName,completedStages:[],files:[],status,message:status,updatedAt:new Date().toISOString()}));
      })();
    `
    );
    const jobs = [];
    for (const ingreso of ['20', '21', '22'])
      jobs.push(await servicio.crear('001234', ingreso, propietario, 'pre-envio'));
    for (let i = 0; i < 100; i++) {
      const registro = JSON.parse(
        await readFile(
          join(carpeta, 'artifacts/eklipse-jobs', jobs[2].id, 'execution.json'),
          'utf8'
        )
      );
      if (registro.status === 'complete') break;
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    expect(await readFile(join(carpeta, 'artifacts/eklipse-jobs/orden.txt'), 'utf8')).toBe(
      '20\n21\n22\n'
    );
    expect((await servicio.consultarCola(propietario)).resumen).toMatchObject({
      total: 3,
      procesados: 3,
      pendientes: 0,
      porcentaje: 100,
    });
  });

  it('reconstruye pendientes guardados tras reinicio y respeta el orden original', async () => {
    const programar = jest.spyOn(servicio as any, 'programar').mockImplementation(() => {});
    const primero = await servicio.crear('001234', '20', propietario, 'concurrente');
    const segundo = await servicio.crear('005678', '21', propietario, 'concurrente');
    expect((await servicio.consultarCola(propietario)).resumen.pendientes).toBe(2);
    programar.mockRestore();
    servicio.onModuleDestroy();
    servicio = new EjecucionesReportesImpl(consultaClinica as any);
    await servicio.onModuleInit();
    const recuperada = await servicio.consultarCola(propietario);
    expect(recuperada.trabajos.map(job => job.id)).toEqual([primero.id, segundo.id]);
    await esperar(primero.id, 'complete');
    await esperar(segundo.id, 'complete');
    const ruta = join(carpeta, 'artifacts/eklipse-jobs');
    const a = JSON.parse(await readFile(join(ruta, primero.id, 'job.json'), 'utf8'));
    const b = JSON.parse(await readFile(join(ruta, segundo.id, 'job.json'), 'utf8'));
    expect(Date.parse(a.startedAt)).toBeLessThan(Date.parse(b.startedAt));
    expect(a.deadline).toBeDefined();
  });

  it('revalida al llegar el turno y continúa con el siguiente si un ingreso dejó de estar activo', async () => {
    const primero = await servicio.crear('001234', '20', propietario, 'concurrente');
    await esperar(primero.id, 'running');
    const cerrado = await servicio.crear('005678', '21', propietario, 'concurrente');
    const tercero = await servicio.crear('007777', '22', propietario, 'concurrente');
    consultaClinica.consultar.mockImplementation(async documento => ({
      paciente: { documento },
      ingresos: [20, 21, 22].map(consecutivo => ({
        consecutivo,
        estado: consecutivo === 21 ? 'Cerrado' : 'Registrado',
        activo: consecutivo !== 21,
      })),
    }));
    expect((await esperar(cerrado.id, 'failed')).mensaje).toContain('ya no está disponible');
    expect(
      JSON.parse(
        await readFile(join(carpeta, 'artifacts/eklipse-jobs', cerrado.id, 'job.json'), 'utf8')
      ).pid
    ).toBeUndefined();
    await esperar(tercero.id, 'complete');
    expect((await servicio.consultarCola(propietario)).resumen.porcentaje).toBe(100);
  });

  it('libera runner.lock si falla guardar el índice entre reservar e iniciar', async () => {
    const guardar = (servicio as any).guardar.bind(servicio);
    let falloPendiente = true;
    jest.spyOn(servicio as any, 'guardar').mockImplementation(async (destino, nombre, valor) => {
      if (
        nombre === 'queue.json' &&
        (servicio as any).activo &&
        !(servicio as any).child &&
        falloPendiente
      ) {
        falloPendiente = false;
        throw new Error('Fallo sintético del índice');
      }
      return guardar(destino, nombre, valor);
    });
    const fallido = await servicio.crear('001234', '20', propietario, 'concurrente');
    const siguiente = await servicio.crear('005678', '21', propietario, 'concurrente');
    await esperar(fallido.id, 'failed');
    await esperar(siguiente.id, 'complete');
    await esperarCierre();
    expect(falloPendiente).toBe(false);
    await expect(
      readFile(join(carpeta, 'artifacts/eklipse-jobs/runner.lock'))
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('inicia el siguiente aunque falle persistir el índice durante close', async () => {
    const guardar = (servicio as any).guardar.bind(servicio);
    let falloPendiente = true;
    jest.spyOn(servicio as any, 'guardar').mockImplementation(async (destino, nombre, valor) => {
      if (
        nombre === 'queue.json' &&
        !(servicio as any).activo &&
        (servicio as any).child &&
        falloPendiente
      ) {
        falloPendiente = false;
        throw new Error('Fallo sintético al finalizar');
      }
      return guardar(destino, nombre, valor);
    });
    const primero = await servicio.crear('001234', '20', propietario, 'concurrente');
    const segundo = await servicio.crear('005678', '21', propietario, 'concurrente');
    await esperar(primero.id, 'complete');
    await esperar(segundo.id, 'complete');
    expect(falloPendiente).toBe(false);
  });

  it('no pierde una reanudación cuando el worker ya marcó failed pero todavía está cerrando', async () => {
    await writeFile(
      join(carpeta, 'src/worker.ts'),
      `
      const fs=require('node:fs/promises'),path=require('node:path'); const folder=process.argv[process.argv.indexOf('--carpeta')+1];
      (async()=>{ const previous=JSON.parse(await fs.readFile(path.join(folder,'execution.json'),'utf8')); const resumed=process.argv.includes('--reanudar');
        await fs.writeFile(path.join(folder,'execution.json'),JSON.stringify({...previous,status:resumed?'complete':'failed',message:'Resultado sintético',updatedAt:new Date().toISOString()}));
        if(!resumed)setTimeout(()=>{},600);
      })();
    `
    );
    const job = await servicio.crear('001234', '20', propietario, 'concurrente');
    await esperar(job.id, 'failed');
    await expect(servicio.reanudar(job.id, propietario)).rejects.toThrow('ejecutor cierre');
    expect((await servicio.consultar(job.id, propietario)).estado).toBe('failed');
    await esperarCierre();
    expect(await servicio.reanudar(job.id, propietario)).toMatchObject({
      id: job.id,
      estado: 'queued',
    });
    await esperar(job.id, 'complete');
  });

  it.each(['job', 'execution'] as const)(
    'recupera un ejecutor vivo desde %s sin duplicarlo y conserva el tiempo máximo original',
    async fuente => {
      const externo = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {
        windowsHide: true,
        stdio: 'ignore',
      });
      procesosExternos.push(externo);
      await new Promise<void>((resolve, reject) => {
        externo.once('spawn', resolve);
        externo.once('error', reject);
      });
      const activo = await guardado({ proceso: 'concurrente', estado: 'running' });
      const ruta = join(activo.destino, 'job.json');
      const job = JSON.parse(await readFile(ruta, 'utf8'));
      const deadline = new Date(Date.now() - 10).toISOString();
      await writeFile(
        ruta,
        JSON.stringify({
          ...job,
          pid: fuente === 'job' ? externo.pid : undefined,
          startedAt: new Date(Date.now() - 5000).toISOString(),
          deadline,
          loteId: randomUUID(),
          secuenciaCola: 1,
        })
      );
      if (fuente === 'execution') {
        const estado = JSON.parse(await readFile(join(activo.destino, 'execution.json'), 'utf8'));
        await writeFile(
          join(activo.destino, 'execution.json'),
          JSON.stringify({
            ...estado,
            pid: externo.pid,
            document: job.documento,
            admission: job.ingreso,
            process: job.proceso,
          })
        );
      }
      await writeFile(
        join(carpeta, 'artifacts/eklipse-jobs/runner.lock'),
        JSON.stringify({ pid: 99999999, childPid: fuente === 'job' ? externo.pid : undefined })
      );
      const siguiente = await servicio.crear('005678', '21', propietario, 'concurrente');
      expect(siguiente.posicionCola).toBe(2);
      expect((await esperar(activo.id, 'failed')).mensaje).toContain('tiempo máximo');
      await esperar(siguiente.id, 'complete');
      expect(JSON.parse(await readFile(ruta, 'utf8')).deadline).toBe(deadline);
      expect(JSON.parse(await readFile(ruta, 'utf8')).pid).toBe(externo.pid);
      expect(externo.exitCode !== null || externo.signalCode !== null).toBe(true);
    }
  );

  it.each(['pre-envio', 'concurrente', 'conciliacion'] as const)(
    'envía el proceso %s explícito al ejecutor sin la omisión de prefactura',
    async proceso => {
      if (proceso === 'conciliacion')
        consultaClinica.consultar.mockImplementation(async documento => ({
          paciente: { documento },
          ingresos: [{ consecutivo: 20, estado: 'Facturado', activo: false }],
        }));
      await writeFile(
        join(carpeta, 'src/worker.ts'),
        `
      const fs = require('node:fs/promises'); const path = require('node:path');
      const folder = process.argv[process.argv.indexOf('--carpeta') + 1];
      const proceso = process.argv[process.argv.indexOf('--proceso') + 1];
      fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({ process: proceso, completedStages: [], status: 'complete', message: process.argv.includes('--sin-prefactura') ? 'Omisión indebida' : proceso, files: [], updatedAt: new Date().toISOString() }));
    `
      );
      const job = await servicio.crear('123', '20', propietario, proceso);
      expect((await esperar(job.id, 'complete')).mensaje).toBe(proceso);
      expect(
        JSON.parse(
          await readFile(join(carpeta, 'artifacts/eklipse-jobs', job.id, 'job.json'), 'utf8')
        ).proceso
      ).toBe(proceso);
    }
  );

  it('calcula la disponibilidad por documentos completos y mantiene aislados los procesos e históricos', async () => {
    const anterior = await guardado({ legacy: true });
    const concurrente = await guardado({ proceso: 'concurrente' });
    const preenvio = await guardado({
      proceso: 'pre-envio',
      archivos: ['historia.pdf', 'notas.pdf', 'prefactura.pdf'],
      tipos: ['historias-clinicas', 'enfermeria', 'prefactura'],
      etapas: ['historias-clinicas', 'enfermeria', 'prefactura'],
    });
    const conciliacion = await guardado({
      proceso: 'conciliacion',
      archivos: ['historia.pdf', 'notas.pdf'],
      tipos: ['historias-clinicas', 'enfermeria'],
      etapas: ['historias-clinicas', 'enfermeria'],
    });
    expect(await servicio.consultar(concurrente.id, propietario)).toMatchObject({
      disponibleParaProceso: true,
      documentosPendientes: [],
    });
    expect(await servicio.consultar(preenvio.id, propietario)).toMatchObject({
      disponibleParaProceso: true,
      documentosPendientes: [],
    });
    expect(await servicio.consultar(conciliacion.id, propietario)).toMatchObject({
      estado: 'complete',
      disponibleParaProceso: false,
      documentosPendientes: ['factura'],
      reanudable: false,
    });
    for (const [proceso, id] of [
      ['pre-envio', preenvio.id],
      ['concurrente', concurrente.id],
      ['conciliacion', conciliacion.id],
    ] as const) {
      expect(
        (await servicio.listar('001234', ['20'], propietario, proceso)).map(job => job.id)
      ).toEqual([id]);
    }
    await expect(servicio.consultar(anterior.id, propietario)).rejects.toBeInstanceOf(
      NotFoundException
    );
    await expect(servicio.reanudar(anterior.id, propietario)).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect((await servicio.archivos(conciliacion.id, propietario)).nombre).toBe(
      'reportes-conciliacion-paciente-001234-ingreso-20.zip'
    );
  });

  it('muestra solo la última conciliación fallida sin revivir el paquete anterior', async () => {
    const completo = await guardado({
      proceso: 'conciliacion',
      fecha: '2026-10-08T12:00:00Z',
      archivos: ['historia.pdf', 'notas.pdf'],
      tipos: ['historias-clinicas', 'enfermeria'],
      etapas: ['historias-clinicas', 'enfermeria'],
    });
    const fallido = await guardado({
      proceso: 'conciliacion',
      estado: 'failed',
      archivos: [],
      fecha: '2026-10-09T12:00:00Z',
    });
    const listado = await servicio.listar('001234', ['20'], propietario, 'conciliacion');
    expect(listado[0]).toMatchObject({
      id: fallido.id,
      disponibleParaProceso: false,
    });
    expect(listado[0].archivos).toHaveLength(0);
    expect(listado[0]).not.toHaveProperty('pendiente');
    expect(await readFile(join(completo.destino, 'historia.pdf'), 'utf8')).toContain('%PDF');
  });

  it('no confunde un grupo parcial ni una etapa sin confirmar con un documento completo', async () => {
    const parcial = await guardado({ proceso: 'concurrente' });
    const ruta = join(parcial.destino, 'execution.json');
    const estado = JSON.parse(await readFile(ruta, 'utf8'));
    estado.files[0].totalGroups = 2;
    await writeFile(ruta, JSON.stringify(estado));
    expect(await servicio.consultar(parcial.id, propietario)).toMatchObject({
      disponibleParaProceso: false,
      documentosPendientes: ['historias-clinicas'],
    });
    estado.files[0].totalGroups = 1;
    estado.completedStages = [];
    await writeFile(ruta, JSON.stringify(estado));
    expect(await servicio.consultar(parcial.id, propietario)).toMatchObject({
      disponibleParaProceso: false,
      documentosPendientes: ['historias-clinicas'],
    });
  });

  it('mantiene incompleto pre-envío sin prefactura y conciliación sin notas', async () => {
    const preenvio = await guardado({
      proceso: 'pre-envio',
      archivos: ['historia.pdf', 'notas.pdf'],
      tipos: ['historias-clinicas', 'enfermeria'],
      etapas: ['historias-clinicas', 'enfermeria'],
    });
    const conciliacion = await guardado({ proceso: 'conciliacion' });
    expect(await servicio.consultar(preenvio.id, propietario)).toMatchObject({
      disponibleParaProceso: false,
      documentosPendientes: ['prefactura'],
    });
    expect(await servicio.consultar(conciliacion.id, propietario)).toMatchObject({
      disponibleParaProceso: false,
      documentosPendientes: ['enfermeria', 'factura'],
    });
  });

  it.each(['borrado', 'alterado'] as const)(
    'retira la disponibilidad y permite recuperar un PDF %s sin ofrecerlo para descarga',
    async modo => {
      const job = await guardado({ proceso: 'concurrente' });
      expect((await servicio.consultar(job.id, propietario)).disponibleParaProceso).toBe(true);
      if (modo === 'borrado') await rm(join(job.destino, 'grupo-001.pdf'));
      else await writeFile(join(job.destino, 'grupo-001.pdf'), '%PDF-1.7 fake');
      expect(await servicio.consultar(job.id, propietario)).toMatchObject({
        estado: 'failed',
        disponibleParaProceso: false,
        documentosPendientes: ['historias-clinicas'],
        archivos: [],
        reanudable: true,
      });
      await expect(servicio.archivo(job.id, '0', propietario)).rejects.toBeInstanceOf(
        NotFoundException
      );
    }
  );

  it('rechaza reanudar otra identidad o cambiar el proceso de una ejecución', async () => {
    const job = await guardado({ proceso: 'concurrente', estado: 'failed' });
    await expect(
      servicio.crear('001234', '20', propietario, 'pre-envio', job.id)
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      servicio.crear('999', '20', propietario, 'concurrente', job.id)
    ).rejects.toBeInstanceOf(ConflictException);
    const ruta = join(job.destino, 'execution.json');
    const estado = JSON.parse(await readFile(ruta, 'utf8'));
    await writeFile(ruta, JSON.stringify({ ...estado, process: 'conciliacion' }));
    await expect(servicio.reanudar(job.id, propietario)).rejects.toBeInstanceOf(ConflictException);
  });

  it('no ofrece documentos ajenos al perfil aunque figuren en el estado del ejecutor', async () => {
    const job = await guardado({
      proceso: 'concurrente',
      archivos: ['historia.pdf', 'prefactura.pdf'],
      tipos: ['historias-clinicas', 'prefactura'],
      etapas: ['historias-clinicas', 'prefactura'],
    });
    expect((await servicio.consultar(job.id, propietario)).archivos.map(file => file.tipo)).toEqual(
      ['historias-clinicas']
    );
    await expect(servicio.archivo(job.id, '1', propietario)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('el supervisor acepta la salida sin prefactura y libera el ejecutor para otra generación', async () => {
    await writeFile(
      join(carpeta, 'src/worker.ts'),
      `
      const fs = require('node:fs/promises'); const path = require('node:path');
      const folder = process.argv[process.argv.indexOf('--carpeta') + 1];
      fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({ status: 'prefactura-unavailable', message: 'Este ingreso no tiene una prefactura disponible', updatedAt: new Date().toISOString(), files: [] }));
    `
    );
    const job = await servicio.crear('123', '20', propietario, 'concurrente');
    await esperar(job.id, 'prefactura-unavailable');
    for (let i = 0; i < 100 && (servicio as any).child; i++)
      await new Promise(resolve => setTimeout(resolve, 50));
    const result = await servicio.consultar(job.id, propietario);
    expect(result.estado).toBe('prefactura-unavailable');
    expect(result.fallo).toBeUndefined();
    expect((servicio as any).child).toBeUndefined();
    const next = await servicio.crear('123', '20', propietario, 'concurrente');
    expect(next.id).not.toBe(job.id);
    await esperar(next.id, 'prefactura-unavailable');
  });

  it('conserva el aviso sin prefactura y no permite reanudarlo como falla', async () => {
    const job = await guardado({ estado: 'prefactura-unavailable', archivos: [] });
    const path = join(job.destino, 'execution.json');
    const state = JSON.parse(await readFile(path, 'utf8'));
    await writeFile(
      path,
      JSON.stringify({ ...state, message: 'Este ingreso no tiene una prefactura disponible' })
    );
    const result = await servicio.consultar(job.id, propietario);
    expect(result.estado).toBe('prefactura-unavailable');
    expect(result.mensaje).toBe('Este ingreso no tiene una prefactura disponible');
    expect(result.reanudable).toBe(false);
    expect(result.fallo).toBeUndefined();
    expect((await servicio.listar('001234', ['20'], propietario, 'pre-envio'))[0].estado).toBe(
      'prefactura-unavailable'
    );
    await expect(servicio.reanudar(job.id, propietario)).rejects.toBeInstanceOf(ConflictException);
  });

  it('muestra solo el aviso vigente sin prefactura y oculta los archivos anteriores', async () => {
    const old = await guardado({ fecha: '2026-10-09T12:00:00Z' });
    const latest = await guardado({
      estado: 'prefactura-unavailable',
      archivos: [],
      fecha: '2026-10-26T12:00:00Z',
    });
    const result = (await servicio.listar('001234', ['20'], propietario, 'pre-envio'))[0];
    expect(result.id).toBe(latest.id);
    expect(result.archivos).toHaveLength(0);
    expect(result.estado).toBe('prefactura-unavailable');
    expect(result).not.toHaveProperty('pendiente');
    expect(await readFile(join(old.destino, 'grupo-001.pdf'), 'utf8')).toContain('%PDF');
  });

  it('ofrece vista previa, descarga individual y ZIP con tipo prefactura', async () => {
    const job = await guardado({
      archivos: ['prefactura.pdf', 'historia.pdf', 'notas-enfermeria.pdf'],
    });
    const path = join(job.destino, 'execution.json');
    const state = JSON.parse(await readFile(path, 'utf8'));
    state.files[0].kind = 'prefactura';
    state.files[2].kind = 'enfermeria';
    await writeFile(path, JSON.stringify(state));
    expect((await servicio.consultar(job.id, propietario)).archivos[0].tipo).toBe('prefactura');
    expect((await servicio.archivo(job.id, '0', propietario)).nombre).toBe('prefactura.pdf');
    const result = await servicio.archivos(job.id, propietario);
    const chunks: Buffer[] = [];
    for await (const chunk of result.contenido) chunks.push(Buffer.from(chunk));
    const zip = await JSZip.loadAsync(Buffer.concat(chunks));
    expect(await zip.file('001234/20/prefactura/1-prefactura.pdf')!.async('string')).toContain(
      '%PDF'
    );
    expect(
      await zip.file('001234/20/historias-clinicas/2-historia.pdf')!.async('string')
    ).toContain('%PDF');
    expect(
      await zip.file('001234/20/enfermeria/3-notas-enfermeria.pdf')!.async('string')
    ).toContain('%PDF');
  });

  it.each(['running', 'complete', 'failed'])(
    'expone las órdenes sin confirmar cuando la ejecución está %s',
    async status => {
      const job = await guardado({ estado: status });
      const jobPath = join(job.destino, 'job.json');
      const data = JSON.parse(await readFile(jobPath, 'utf8'));
      data.pid = process.pid;
      await writeFile(jobPath, JSON.stringify(data));
      const statePath = join(job.destino, 'execution.json');
      const state = JSON.parse(await readFile(statePath, 'utf8'));
      await writeFile(
        statePath,
        JSON.stringify({
          ...state,
          notices: [
            {
              type: 'ordenes-sin-confirmar',
              admission: '20',
              occurredAt: '2026-10-26T12:00:00Z',
              message: 'Órdenes de servicio sin confirmar del ingreso 20: 12485732, 12485733.',
              orders: ['12485732', '12485733'],
            },
          ],
        })
      );
      const result = await servicio.consultar(job.id, propietario);
      expect(result.avisos).toEqual([
        {
          tipo: 'ordenes-sin-confirmar',
          ingreso: '20',
          fecha: '2026-10-26T12:00:00Z',
          mensaje: 'Órdenes de servicio sin confirmar del ingreso 20: 12485732, 12485733.',
          ordenes: ['12485732', '12485733'],
        },
      ]);
    }
  );

  it('recupera las órdenes de avisos.json en ejecuciones anteriores y protege su propietario', async () => {
    const job = await guardado({ archivos: [] });
    const folder = join(job.destino, 'reportes', '001234', '20', 'prefactura');
    await mkdir(folder, { recursive: true });
    await writeFile(
      join(folder, 'avisos.json'),
      JSON.stringify([
        {
          type: 'ordenes-sin-confirmar',
          admission: '20',
          occurredAt: '2026-10-26T12:00:00Z',
          message: 'Orden sin confirmar: 12485732.',
          orders: ['12485732'],
        },
        {
          type: 'ordenes-sin-confirmar',
          admission: '999',
          occurredAt: '',
          message: 'Aviso de otro ingreso.',
          orders: ['99999'],
        },
      ])
    );
    expect((await servicio.consultar(job.id, propietario)).avisos).toHaveLength(1);
    expect((await servicio.consultar(job.id, propietario)).avisos?.[0].ordenes).toEqual([
      '12485732',
    ]);
    expect(
      (await servicio.listar('001234', ['20'], propietario, 'pre-envio'))[0].avisos?.[0].mensaje
    ).toContain('12485732');
    await expect(servicio.consultar(job.id, { ...propietario, usuario: 8 })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('mantiene la ausencia de notas como aviso informativo con ejecución completa al 100%', async () => {
    const job = await guardado({
      estado: 'complete',
      progreso: {
        stage: 'completo',
        completed: 1,
        total: 1,
        current: null,
        generalPercentage: 100,
      },
    });
    const path = join(job.destino, 'execution.json');
    const state = JSON.parse(await readFile(path, 'utf8'));
    await writeFile(
      path,
      JSON.stringify({
        ...state,
        message: 'Este ingreso no tiene notas de enfermería',
        notices: [
          {
            type: 'enfermeria-sin-notas',
            admission: '20',
            occurredAt: '2026-10-26T12:00:00Z',
            message: 'Este ingreso no tiene notas de enfermería',
            orders: [],
          },
        ],
      })
    );
    const result = await servicio.consultar(job.id, propietario);
    expect(result.estado).toBe('complete');
    expect(result.reanudable).toBe(false);
    expect(result.progreso?.porcentajeGeneral).toBe(100);
    expect(result.fallo).toBeUndefined();
    expect(result.fallas).toEqual([]);
    expect(result.avisos?.[0]).toMatchObject({
      tipo: 'enfermeria-sin-notas',
      mensaje: 'Este ingreso no tiene notas de enfermería',
    });
  });

  it.each(['prefactura-sin-servicios', 'prefactura-no-disponible'] as const)(
    'expone el aviso %s de una generación completa',
    async tipo => {
      const job = await guardado({ estado: 'complete' });
      const path = join(job.destino, 'execution.json');
      const state = JSON.parse(await readFile(path, 'utf8'));
      await writeFile(
        path,
        JSON.stringify({
          ...state,
          notices: [
            {
              type: tipo,
              admission: '20',
              occurredAt: '2026-10-26T12:00:00Z',
              message:
                'Este ingreso no tiene una prefactura disponible. No se han cargado servicios a la hoja de trabajo.',
              orders: [],
            },
          ],
        })
      );
      const result = await servicio.consultar(job.id, propietario);
      expect(result.estado).toBe('complete');
      expect(result.reanudable).toBe(false);
      expect(result.fallo).toBeUndefined();
      expect(result.avisos?.[0].tipo).toBe(tipo);
      expect(result.avisos?.[0].mensaje).toContain('No se han cargado servicios');
    }
  );

  for (const tecnico of [false, true]) {
    it(`oculta ejecuciones sin proceso y conserva sus metadatos sin reclasificar: técnico=${tecnico}`, async () => {
      const job = await guardado({ estado: 'failed', legacy: true });
      const path = join(job.destino, 'execution.json');
      const state = JSON.parse(await readFile(path, 'utf8'));
      state.files[0].kind = 'enfermeria';
      const sinFolios = {
        occurredAt: '2026-10-26T12:00:00Z',
        message: 'Paciente sin folios',
        stage: 'historias-clinicas',
        step: 'Consultando folios',
        group: null,
        totalGroups: null,
        details: 'Paciente sin folios',
      };
      const fallaTecnica = {
        ...sinFolios,
        stage: 'enfermeria',
        message: 'No se pudo descargar el PDF',
      };
      state.failures = tecnico ? [sinFolios, fallaTecnica] : [sinFolios];
      state.pendingFailures = state.failures;
      state.failure = tecnico ? fallaTecnica : sinFolios;
      await writeFile(path, JSON.stringify(state));
      await expect(servicio.consultar(job.id, propietario)).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(await servicio.listar('001234', ['20'], propietario, null)).toEqual([]);
      expect(JSON.parse(await readFile(path, 'utf8')).failures[0].message).toBe(
        'Paciente sin folios'
      );
    });
  }

  it('no permite consultar ni reanudar ejecuciones sin proceso', async () => {
    const job = await guardado({ estado: 'failed', archivos: [], legacy: true });
    const path = join(job.destino, 'execution.json');
    const state = JSON.parse(await readFile(path, 'utf8'));
    state.failure = {
      occurredAt: '',
      message: 'Paciente sin folios',
      stage: 'historias-clinicas',
      step: '',
      group: null,
      totalGroups: null,
      details: '',
    };
    await writeFile(path, JSON.stringify(state));
    await expect(servicio.consultar(job.id, propietario)).rejects.toBeInstanceOf(NotFoundException);
    await expect(servicio.reanudar(job.id, propietario)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('expone todos los errores registrados aunque la ejecución termine correctamente al reanudar', async () => {
    const job = await guardado({ estado: 'complete' });
    const path = join(job.destino, 'execution.json');
    const state = JSON.parse(await readFile(path, 'utf8'));
    const failures = [1, 2].map(group => ({
      occurredAt: '2026-10-26T12:00:00Z',
      message: 'Falló grupo ' + group,
      step: 'Descargando',
      stage: 'historias-clinicas',
      group,
      totalGroups: 3,
      details: 'Tiempo agotado.',
    }));
    await writeFile(path, JSON.stringify({ ...state, failures, pendingFailures: [] }));
    const result = await servicio.consultar(job.id, propietario);
    expect(result.estado).toBe('complete');
    expect(result.fallas).toHaveLength(2);
    expect(result.fallas?.map(fallo => fallo.grupo)).toEqual([1, 2]);
    expect(result.fallo).toBeUndefined();
    expect(
      (await servicio.listar('001234', ['20'], propietario, 'pre-envio'))[0].fallas
    ).toHaveLength(2);
  });

  it('expone todas las fallas pendientes mientras el ejecutor continúa trabajando', async () => {
    const job = await guardado({ estado: 'running' });
    const ruta = join(job.destino, 'execution.json');
    const estado = JSON.parse(await readFile(ruta, 'utf8'));
    // Simula el ejecutor activo para que la consulta no lo clasifique como huérfano.
    const datos = JSON.parse(await readFile(join(job.destino, 'job.json'), 'utf8'));
    await writeFile(join(job.destino, 'job.json'), JSON.stringify({ ...datos, pid: process.pid }));
    const pendingFailures = [2, 3].map(group => ({
      occurredAt: '2026-10-15T12:00:00Z',
      message: `Falló el grupo ${group}.`,
      step: 'Descargando historias clínicas.',
      stage: 'historias-clinicas',
      group,
      totalGroups: 3,
      details: 'Tiempo agotado.',
    }));
    await writeFile(
      ruta,
      JSON.stringify({
        ...estado,
        message: 'Descargando enfermería.',
        failure: pendingFailures[1],
        pendingFailures,
      })
    );
    const respuesta = await servicio.consultar(job.id, propietario);
    expect(respuesta.estado).toBe('running');
    expect(respuesta.reanudable).toBe(false);
    expect(respuesta.mensaje).toBe('Descargando enfermería.');
    expect(respuesta.fallasPendientes).toHaveLength(2);
    expect(respuesta.fallasPendientes?.map(falla => falla.grupo)).toEqual([2, 3]);
    expect(respuesta.fallasPendientes?.[0]).toMatchObject({
      etapa: 'historias-clinicas',
      paso: 'Descargando historias clínicas.',
      totalGrupos: 3,
    });
  });

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
    expect(resultado.nombre).toBe('reportes-pre-envio-paciente-001234-ingreso-20.zip');
    expect(archivos.map(archivo => archivo.name)).toEqual([
      '001234/20/historias-clinicas/1-grupo-001.pdf',
      '001234/20/historias-clinicas/2-grupo-002.pdf',
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

  it('ofrece solo los PDF unificados en el modal y ZIP conservando los enlaces de los originales', async () => {
    const job = await guardado({
      archivos: [
        'grupo-001.pdf',
        'grupo-002.pdf',
        'historia-unificada.pdf',
        'enfermeria-001.pdf',
        'enfermeria-unificada.pdf',
      ],
    });
    const rutaEstado = join(job.destino, 'execution.json');
    const estado = JSON.parse(await readFile(rutaEstado, 'utf8'));
    estado.files[0].superseded = true;
    estado.files[1].superseded = true;
    Object.assign(estado.files[2], { unified: true, pages: 10, group: 1, totalGroups: 2 });
    Object.assign(estado.files[3], { superseded: true, kind: 'enfermeria' });
    Object.assign(estado.files[4], {
      unified: true,
      pages: 8,
      group: 1,
      totalGroups: 2,
      kind: 'enfermeria',
    });
    await writeFile(rutaEstado, JSON.stringify(estado));
    const respuesta = await servicio.consultar(job.id, propietario);
    expect(respuesta.archivos.map(archivo => archivo.id)).toEqual(['2', '4']);
    expect(respuesta.archivos[0]).toMatchObject({
      nombre: 'historia-unificada.pdf',
      unificado: true,
      paginas: 10,
    });
    expect(respuesta.archivos[1]).toMatchObject({
      tipo: 'enfermeria',
      unificado: true,
      paginas: 8,
    });
    expect((await servicio.archivo(job.id, '1', propietario)).nombre).toBe('grupo-002.pdf');
    expect((await servicio.archivo(job.id, '4', propietario)).nombre).toBe(
      'enfermeria-unificada.pdf'
    );
    const resultado = await servicio.archivos(job.id, propietario);
    const bloques: Buffer[] = [];
    for await (const bloque of resultado.contenido) bloques.push(Buffer.from(bloque));
    const zip = await JSZip.loadAsync(Buffer.concat(bloques));
    expect(
      Object.values(zip.files)
        .filter(archivo => !archivo.dir)
        .map(archivo => archivo.name)
    ).toEqual([
      '001234/20/historias-clinicas/3-historia-unificada.pdf',
      '001234/20/enfermeria/5-enfermeria-unificada.pdf',
    ]);
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
    const job = await servicio.crear('001234', '20', propietario, 'concurrente');
    expect(job.estado).toBe('queued');
    expect((await servicio.crear('001234', '20', propietario, 'concurrente')).id).toBe(job.id);
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
    const recuperada = new EjecucionesReportesImpl(consultaClinica as any);
    expect((await recuperada.consultar(job.id, propietario)).estado).toBe('complete');
    recuperada.onModuleDestroy();
  });

  it('rechaza sedes y rutas ajenas', async () => {
    await expect(
      servicio.crear('123', '20', { ...propietario, contexto: 'SANJUAN' }, 'concurrente')
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
    const resultado = await servicio.listar('001234', ['20'], propietario, 'pre-envio');
    expect(resultado.map(reporte => reporte.id)).toEqual([correcto.id]);
    expect(resultado[0].archivos[0].id).toBe('0');
    expect(JSON.stringify(resultado)).not.toContain(carpeta);
  });

  it('muestra únicamente la solicitud parcial posterior a una descarga completa', async () => {
    await guardado({ fecha: '2026-10-07T12:00:00Z' });
    await guardado({ fecha: '2026-10-08T12:00:00Z' });
    const fallida = await guardado({ fecha: '2026-10-09T12:00:00Z', estado: 'failed' });
    const reporte = (await servicio.listar('001234', ['20'], propietario, 'pre-envio'))[0];
    expect(reporte.id).toBe(fallida.id);
    expect(reporte).not.toHaveProperty('pendiente');
  });

  it('omite archivos borrados, conserva sus identificadores y ofrece resultados parciales', async () => {
    const job = await guardado({ archivos: ['borrado.pdf', 'conservado.pdf'] });
    await rm(join(job.destino, 'borrado.pdf'));
    const resultado = await servicio.listar('001234', ['20'], propietario, 'pre-envio');
    expect(resultado[0].estado).toBe('failed');
    expect(resultado[0].archivos.map(archivo => archivo.id)).toEqual(['1']);
    expect((await servicio.archivo(job.id, '1', propietario)).nombre).toBe('conservado.pdf');
    await rm(join(job.destino, 'conservado.pdf'));
    const sinArchivos = await servicio.listar('001234', ['20'], propietario, 'pre-envio');
    expect(sinArchivos[0]).toMatchObject({ estado: 'failed', archivos: [], reanudable: true });
  });

  it('devuelve una búsqueda vacía cuando todavía no se han guardado reportes', async () => {
    expect(await servicio.listar('001234', ['20'], propietario, null)).toEqual([]);
  });

  it('registra un ejecutable inexistente como fallo y libera el bloqueo', async () => {
    process.env.EKLIPSE_AUTOMATION_NODE = join(carpeta, 'no-existe.exe');
    const job = await servicio.crear('123', '20', propietario, 'concurrente');
    const resultado = await esperar(job.id, 'failed');
    expect(resultado.archivos).toEqual([]);
    for (let index = 0; index < 40 && (servicio as any).child; index++)
      await new Promise(resolve => setTimeout(resolve, 50));
    delete process.env.EKLIPSE_AUTOMATION_NODE;
    expect((await servicio.crear('123', '20', propietario, 'concurrente')).estado).toBe('queued');
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
          files: [{ name: 'grupo-001.pdf', relativePath: 'grupo-001.pdf', bytes: 13, sha256: require('node:crypto').createHash('sha256').update('%PDF-1.7 test').digest('hex'), group: 1, totalGroups: 2, kind: 'historias-clinicas' }]
        }));
        setInterval(() => {}, 1000);
      })();
    `
    );
    process.env.EKLIPSE_AUTOMATION_TIMEOUT_MS = '1500';
    const job = await servicio.crear('123', '20', propietario, 'concurrente');
    const resultado = await esperar(job.id, 'failed');
    expect(resultado.mensaje).toContain('tiempo máximo');
    expect(resultado.progreso?.porcentajeGeneral).toBe(40);
    expect(resultado.archivos.length).toBe(1);
    expect(resultado.fallo).toMatchObject({ paso: 'En proceso', grupo: 2, totalGrupos: 2 });
    expect((await servicio.archivo(job.id, '0', propietario)).nombre).toBe('grupo-001.pdf');
  });

  it('encuentra las fallas sin PDF y reanuda la misma ejecución sin perder archivos, errores o avance', async () => {
    const vacia = await guardado({
      ingreso: '21',
      estado: 'failed',
      archivos: [],
      proceso: 'concurrente',
    });
    expect((await servicio.listar('001234', ['21'], propietario, 'concurrente'))[0]).toMatchObject({
      id: vacia.id,
      reanudable: true,
    });
    const job = await guardado({
      estado: 'failed',
      proceso: 'concurrente',
      progreso: {
        stage: 'historias-clinicas',
        completed: 1,
        total: 3,
        current: 2,
        generalPercentage: 35,
      },
    });
    const rutaEstado = join(job.destino, 'execution.json');
    const estado = JSON.parse(await readFile(rutaEstado, 'utf8'));
    estado.failure = {
      occurredAt: new Date().toISOString(),
      message: 'No cargó el grupo 2.',
      step: 'Descargando historias clínicas.',
      stage: 'historias-clinicas',
      group: 2,
      totalGroups: 3,
      details: 'Esperando el documento listo.',
    };
    estado.failures = [estado.failure];
    await writeFile(rutaEstado, JSON.stringify(estado));
    await writeFile(
      join(carpeta, 'src/worker.ts'),
      `
      const fs = require('node:fs/promises'); const path = require('node:path');
      const folder = process.argv[process.argv.indexOf('--carpeta') + 1];
      (async () => {
        if (!process.argv.includes('--reanudar')) process.exit(2);
        const previous = JSON.parse(await fs.readFile(path.join(folder, 'execution.json'), 'utf8'));
        if (!previous.files.length || !previous.failures.length) process.exit(3);
        await fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({...previous, status:'running', message:'Reanudando grupo 2.'}));
        setTimeout(async () => await fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({...previous, status:'complete', message:'Completo.'})), 300);
      })();
    `
    );
    await expect(servicio.reanudar(job.id, { ...propietario, usuario: 8 })).rejects.toBeInstanceOf(
      NotFoundException
    );
    const attempts = await Promise.allSettled([
      servicio.reanudar(job.id, propietario),
      servicio.reanudar(job.id, propietario),
    ]);
    expect(attempts.filter(result => result.status === 'fulfilled')).toHaveLength(2);
    const resumed = attempts.find(
      result => result.status === 'fulfilled'
    ) as PromiseFulfilledResult<any>;
    expect(resumed.value).toMatchObject({
      id: job.id,
      estado: 'queued',
      progreso: { porcentajeGeneral: 35 },
    });
    const result = await esperar(job.id, 'complete');
    expect(result.id).toBe(job.id);
    expect(await readFile(join(job.destino, 'grupo-001.pdf'), 'utf8')).toContain('%PDF');
    expect(JSON.parse(await readFile(rutaEstado, 'utf8')).failures).toHaveLength(1);
    await expect(servicio.reanudar(job.id, propietario)).rejects.toBeInstanceOf(ConflictException);
  });
});
