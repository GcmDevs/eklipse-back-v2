import { NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EjecucionesReportesImpl, PropietarioReportes } from './ejecuciones.impl';
import { ProcesoReportes } from '../../domain/proceso';

jest.mock('./consulta-cola.impl', () => ({ ConsultaColaReportesImpl: class {} }));

describe('Una única solicitud vigente por propietario, paciente, ingreso y proceso', () => {
  const entornoOriginal = { ...process.env };
  const propietario: PropietarioReportes = {
    usuario: 7,
    contexto: 'ALTACENTRO',
    esDinamica: true,
  };
  const pdf = Buffer.from('%PDF-1.7 Documento sintético');
  let carpeta: string;
  let trabajos: string;
  let servicio: EjecucionesReportesImpl;
  let programar: jest.SpyInstance;
  let secuencia: number;

  beforeEach(async () => {
    secuencia = 0;
    carpeta = await mkdtemp(join(tmpdir(), 'eklipse-reemplazo-'));
    trabajos = join(carpeta, 'artifacts', 'eklipse-jobs');
    process.env.EKLIPSE_AUTOMATION_DIR = carpeta;
    delete process.env.EKLIPSE_AUTOMATION_NODE;
    delete process.env.EKLIPSE_AUTOMATION_CONTEXT;
    delete process.env.EKLIPSE_AUTOMATION_TIMEOUT_MS;
    await mkdir(join(carpeta, 'src'));
    await mkdir(trabajos, { recursive: true });
    // Ejecuta únicamente escritura de archivos sintéticos; no abre navegador ni DG Web.
    await writeFile(
      join(carpeta, 'src', 'worker.ts'),
      `const fs = require('node:fs/promises');
      const path = require('node:path');
      const crypto = require('node:crypto');
      const folder = process.argv[process.argv.indexOf('--carpeta') + 1];
      const processName = process.argv[process.argv.indexOf('--proceso') + 1];
      (async () => {
        const body = Buffer.from('%PDF-1.7 Nueva versión sintética');
        const name = 'nuevo.pdf';
        await fs.writeFile(path.join(folder, name), body);
        await fs.writeFile(path.join(folder, 'execution.json'), JSON.stringify({
          process: processName, status: 'complete', message: 'Completo',
          completedStages: ['historias-clinicas'], updatedAt: new Date().toISOString(),
          files: [{ name, relativePath: name, bytes: body.length,
            sha256: crypto.createHash('sha256').update(body).digest('hex'),
            group: 1, totalGroups: 1, kind: 'historias-clinicas' }]
        }));
      })().catch(() => { process.exitCode = 1; });`
    );
    servicio = new EjecucionesReportesImpl({
      consultar: jest.fn(async (documento: string) => ({
        paciente: { documento },
        ingresos: [
          { consecutivo: 20, estado: 'Registrado', activo: true, tipoIngreso: 'Urgencias' },
        ],
      })),
    } as any);
    programar = jest.spyOn(servicio as any, 'programar').mockImplementation(() => {});
  });

  afterEach(async () => {
    servicio.onModuleDestroy();
    for (let intento = 0; intento < 100 && (servicio as any).child; intento++)
      await new Promise(resolve => setTimeout(resolve, 30));
    await (servicio as any).mutex;
    expect((servicio as any).child).toBeUndefined();
    jest.restoreAllMocks();
    const destino = await realpath(carpeta);
    expect(destino.startsWith(await realpath(tmpdir()))).toBe(true);
    expect(destino).toContain('eklipse-reemplazo-');
    await rm(destino, { recursive: true, force: true });
    process.env = { ...entornoOriginal };
  });

  async function guardado(
    opciones: {
      estado?: 'queued' | 'complete' | 'failed';
      archivos?: string[];
      proceso?: ProcesoReportes;
      legacy?: boolean;
      documento?: string;
      ingreso?: string;
      propietario?: PropietarioReportes;
    } = {}
  ) {
    const id = randomUUID();
    const destino = join(trabajos, id);
    const proceso = opciones.legacy ? undefined : (opciones.proceso ?? 'concurrente');
    const nombres = opciones.archivos ?? ['vigente.pdf'];
    await mkdir(destino);
    await writeFile(
      join(destino, 'job.json'),
      JSON.stringify({
        id,
        documento: opciones.documento ?? '001234',
        ingreso: opciones.ingreso ?? '20',
        proceso,
        propietario: opciones.propietario ?? propietario,
        secuenciaCola: ++secuencia,
        createdAt: new Date(1700000000000 + secuencia * 1000).toISOString(),
      })
    );
    await writeFile(
      join(destino, 'execution.json'),
      JSON.stringify({
        process: proceso,
        status: opciones.estado ?? 'complete',
        completedStages: opciones.estado === 'failed' ? [] : ['historias-clinicas'],
        message: 'Solicitud sintética',
        updatedAt: new Date().toISOString(),
        files: nombres.map((name, index) => ({
          name,
          relativePath: name,
          bytes: pdf.length,
          sha256: createHash('sha256').update(pdf).digest('hex'),
          group: index + 1,
          totalGroups: nombres.length,
          kind: 'historias-clinicas',
        })),
      })
    );
    for (const name of nombres) await writeFile(join(destino, name), pdf);
    return { id, destino };
  }

  async function inaccesible(id: string, dueno = propietario) {
    await expect(servicio.consultar(id, dueno)).rejects.toBeInstanceOf(NotFoundException);
    await expect(servicio.archivo(id, '0', dueno)).rejects.toBeInstanceOf(NotFoundException);
    await expect(servicio.archivos(id, dueno)).rejects.toBeInstanceOf(NotFoundException);
    await expect(servicio.reanudar(id, dueno)).rejects.toBeInstanceOf(NotFoundException);
  }

  it('la última queued oculta las versiones anteriores antes de aplicar filtros y bloquea sus IDs y los legacy', async () => {
    const viejo = await guardado({ archivos: ['solo-anterior.pdf'] });
    const legacy = await guardado({ legacy: true, archivos: ['legacy.pdf'] });
    const ultimo = await guardado({ estado: 'queued', archivos: [] });
    expect(await servicio.listar('001234', ['20'], propietario, 'concurrente')).toEqual([
      expect.objectContaining({ id: ultimo.id, estado: 'queued', archivos: [] }),
    ]);
    for (const filtros of [
      {},
      { archivo: 'solo-anterior' },
      { busqueda: 'solo-anterior' },
      { proceso: 'concurrente' as const },
    ]) {
      expect(await servicio.listarGenerados(propietario, 1, filtros)).toMatchObject({
        reportes: [],
        total: 0,
      });
    }
    await inaccesible(viejo.id);
    await inaccesible(legacy.id);
    expect(await readFile(join(viejo.destino, 'solo-anterior.pdf'))).toEqual(pdf);
  });

  it('la última fallida con PDF parcial reemplaza a la anterior y retira sus documentos del disco', async () => {
    const viejo = await guardado({ archivos: ['anterior.pdf'] });
    const ultimo = await guardado({ estado: 'failed', archivos: ['parcial.pdf'] });
    const lista = await servicio.listar('001234', ['20'], propietario, 'concurrente');
    expect(lista).toEqual([expect.objectContaining({ id: ultimo.id, estado: 'failed' })]);
    expect(lista[0].archivos.map(archivo => archivo.nombre)).toEqual(['parcial.pdf']);
    expect(lista[0]).not.toHaveProperty('pendiente');
    const generados = await servicio.listarGenerados(propietario, 1, {});
    expect(generados.reportes.map(reporte => reporte.id)).toEqual([ultimo.id]);
    expect((await servicio.listarGenerados(propietario, 1, { archivo: 'anterior' })).total).toBe(0);
    await expect(readFile(join(viejo.destino, 'anterior.pdf'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect(JSON.parse(await readFile(join(viejo.destino, 'job.json'), 'utf8')).reemplazadoPor).toBe(
      ultimo.id
    );
    expect(await readFile(join(ultimo.destino, 'parcial.pdf'))).toEqual(pdf);
    await inaccesible(viejo.id);
  });

  it('la última fallida sin PDF conserva temporalmente el disco anterior sin revivirlo en la API', async () => {
    const viejo = await guardado();
    const ultimo = await guardado({ estado: 'failed', archivos: [] });
    expect(await servicio.consultar(ultimo.id, propietario)).toMatchObject({
      estado: 'failed',
      archivos: [],
    });
    expect(await servicio.listar('001234', ['20'], propietario, 'concurrente')).toEqual([
      expect.objectContaining({ id: ultimo.id, archivos: [] }),
    ]);
    expect((await servicio.listarGenerados(propietario, 1, {})).total).toBe(0);
    expect(await readFile(join(viejo.destino, 'vigente.pdf'))).toEqual(pdf);
    await inaccesible(viejo.id);
  });

  it('una extracción completa sin folios retira la versión anterior con evidencia de ausencia confirmada', async () => {
    const viejo = await guardado();
    const ultimo = await guardado({ archivos: [] });
    const rutaEstado = join(ultimo.destino, 'execution.json');
    const estado = JSON.parse(await readFile(rutaEstado, 'utf8'));
    estado.completedStages = [];
    estado.notices = [
      {
        type: 'historias-sin-folios',
        admission: '20',
        occurredAt: new Date().toISOString(),
        message: 'Paciente sin folios',
        orders: [],
      },
    ];
    await writeFile(rutaEstado, JSON.stringify(estado));
    expect(await servicio.consultar(ultimo.id, propietario)).toMatchObject({
      estado: 'complete',
      archivos: [],
      disponibleParaProceso: false,
      avisos: [expect.objectContaining({ tipo: 'historias-sin-folios' })],
    });
    await expect(readFile(join(viejo.destino, 'vigente.pdf'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect(JSON.parse(await readFile(join(viejo.destino, 'job.json'), 'utf8')).reemplazadoPor).toBe(
      ultimo.id
    );
    await inaccesible(viejo.id);
  });

  it('la cola incluye solo las últimas solicitudes queued y failed sin PDF y calcula el resumen sin versiones anteriores', async () => {
    const viejoA = await guardado({ archivos: ['anterior-a.pdf'] });
    const viejoB = await guardado({ ingreso: '21', archivos: ['anterior-b.pdf'] });
    const ultimoA = await guardado({ estado: 'queued', archivos: [] });
    const ultimoB = await guardado({ ingreso: '21', estado: 'failed', archivos: [] });
    for (const solicitud of [viejoA, viejoB, ultimoA, ultimoB]) {
      const ruta = join(solicitud.destino, 'job.json');
      const job = JSON.parse(await readFile(ruta, 'utf8'));
      await writeFile(ruta, JSON.stringify({ ...job, loteId: 'lote-compartido' }));
    }
    const cola = await servicio.consultarCola(propietario);
    expect(cola).toMatchObject({
      trabajos: [
        { id: ultimoA.id, estado: 'queued', archivos: [] },
        { id: ultimoB.id, estado: 'failed', archivos: [] },
      ],
      totalEnCola: 1,
      resumen: { total: 2, procesados: 1, enCurso: 0, pendientes: 1, porcentaje: 50 },
    });
    expect(cola.trabajos.map(trabajo => trabajo.id)).toEqual([ultimoA.id, ultimoB.id]);
    expect((await servicio.listarGenerados(propietario, 1, {})).reportes).toEqual([]);
    expect(await readFile(join(viejoA.destino, 'anterior-a.pdf'))).toEqual(pdf);
    expect(await readFile(join(viejoB.destino, 'anterior-b.pdf'))).toEqual(pdf);
  });

  it.each(['perdido', 'corrupto', 'estructura inválida'])(
    'un execution.json %s de la última solicitud no recupera la versión vieja',
    async modo => {
      const viejo = await guardado();
      const ultimo = await guardado({ archivos: ['nuevo.pdf'] });
      const estado = join(ultimo.destino, 'execution.json');
      if (modo === 'perdido') await rm(estado);
      else
        await writeFile(
          estado,
          modo === 'corrupto' ? '{JSON incompleto' : JSON.stringify({ status: 'complete' })
        );
      const lista = await servicio.listar('001234', ['20'], propietario, 'concurrente');
      expect(lista).toEqual([
        expect.objectContaining({ id: ultimo.id, estado: 'failed', archivos: [] }),
      ]);
      expect((await servicio.listarGenerados(propietario, 1, {})).total).toBe(0);
      expect(await readFile(join(viejo.destino, 'vigente.pdf'))).toEqual(pdf);
      await inaccesible(viejo.id);
    }
  );

  it('retira la versión anterior al cerrar el worker sin consultar la solicitud nueva', async () => {
    const viejo = await guardado({ archivos: ['anterior.pdf'] });
    programar.mockRestore();
    const consultar = jest.spyOn(servicio, 'consultar');
    const nuevo = await servicio.crear('001234', '20', propietario, 'concurrente');
    let retirado = false;
    for (let intento = 0; intento < 150; intento++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      try {
        await readFile(join(viejo.destino, 'anterior.pdf'));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT' && !(servicio as any).child) {
          retirado = true;
          break;
        }
      }
    }
    await (servicio as any).mutex;
    expect(retirado).toBe(true);
    expect(consultar).not.toHaveBeenCalled();
    expect(JSON.parse(await readFile(join(viejo.destino, 'job.json'), 'utf8')).reemplazadoPor).toBe(
      nuevo.id
    );
    const estado = JSON.parse(await readFile(join(trabajos, nuevo.id, 'execution.json'), 'utf8'));
    expect(estado.status).toBe('complete');
    expect(await readFile(join(trabajos, nuevo.id, 'nuevo.pdf'), 'utf8')).toContain(
      'Nueva versión'
    );
  });

  it.each([
    { caso: 'usuario', propietario: { ...propietario, usuario: 8 } },
    { caso: 'contexto', propietario: { ...propietario, contexto: 'SANJUAN' } },
    { caso: 'fuente de datos', propietario: { ...propietario, esDinamica: false } },
    { caso: 'paciente', documento: '005678' },
    { caso: 'ingreso', ingreso: '21' },
    { caso: 'proceso', proceso: 'pre-envio' as const },
  ])('reemplazar una solicitud no toca otra que difiere en $caso', async diferencia => {
    const viejo = await guardado({ archivos: ['anterior.pdf'] });
    const otro = await guardado(diferencia);
    const ultimo = await guardado({ estado: 'failed', archivos: ['nuevo.pdf'] });
    await servicio.consultar(ultimo.id, propietario);
    await expect(readFile(join(viejo.destino, 'anterior.pdf'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect(await readFile(join(otro.destino, 'vigente.pdf'))).toEqual(pdf);
    expect((await servicio.consultar(otro.id, diferencia.propietario ?? propietario)).id).toBe(
      otro.id
    );
    expect(JSON.parse(await readFile(join(otro.destino, 'job.json'), 'utf8'))).not.toHaveProperty(
      'reemplazadoPor'
    );
  });

  it('retira archivos anteriores sin seguir una ruta de execution.json fuera de la raíz de trabajos', async () => {
    const viejo = await guardado({ archivos: ['anterior.pdf'] });
    const externo = join(carpeta, 'externo.pdf');
    await writeFile(externo, pdf);
    const rutaEstado = join(viejo.destino, 'execution.json');
    const estado = JSON.parse(await readFile(rutaEstado, 'utf8'));
    estado.files.push({
      ...estado.files[0],
      name: 'externo.pdf',
      relativePath: '../../../externo.pdf',
    });
    await writeFile(rutaEstado, JSON.stringify(estado));
    const ultimo = await guardado({ estado: 'failed', archivos: ['parcial.pdf'] });
    await servicio.consultar(ultimo.id, propietario);
    await expect(readFile(join(viejo.destino, 'anterior.pdf'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect(await readFile(externo)).toEqual(pdf);
  });

  it.each(['execution.json', 'queue.json', 'job.json'])(
    'un fallo al persistir %s durante la creación conserva el vigente anterior y no publica un nuevo job',
    async nombreFallido => {
      const vigente = await guardado();
      await servicio.onModuleInit();
      const guardarOriginal = (servicio as any).guardar.bind(servicio);
      let fallo = false;
      const guardar = jest
        .spyOn(servicio as any, 'guardar')
        .mockImplementation(async (...args: unknown[]) => {
          const [destino, nombre, valor] = args as [string, string, any];
          if (
            !fallo &&
            nombre === nombreFallido &&
            destino !== vigente.destino &&
            (nombre !== 'queue.json' || valor.pendientes.length > 0)
          ) {
            fallo = true;
            throw new Error('Persistencia interrumpida');
          }
          return guardarOriginal(destino, nombre, valor);
        });
      await expect(servicio.crear('001234', '20', propietario, 'concurrente')).rejects.toThrow(
        'Persistencia interrumpida'
      );
      guardar.mockRestore();
      expect(fallo).toBe(true);
      expect(
        (await readdir(trabajos, { withFileTypes: true }))
          .filter(entrada => entrada.isDirectory())
          .map(entrada => entrada.name)
      ).toEqual([vigente.id]);
      expect(
        (await servicio.listar('001234', ['20'], propietario, 'concurrente')).map(
          reporte => reporte.id
        )
      ).toEqual([vigente.id]);
      expect(
        (await servicio.listarGenerados(propietario, 1, {})).reportes.map(reporte => reporte.id)
      ).toEqual([vigente.id]);
      expect(await readFile(join(vigente.destino, 'vigente.pdf'))).toEqual(pdf);
      expect(
        JSON.parse(await readFile(join(vigente.destino, 'job.json'), 'utf8'))
      ).not.toHaveProperty('reemplazadoPor');
      expect((await servicio.consultarCola(propietario)).trabajos).toEqual([]);
    }
  );

  it('si falla guardar execution.json al reanudar conserva el estado fallido y la cola vacía', async () => {
    const vigente = await guardado({ estado: 'failed', archivos: ['parcial.pdf'] });
    await servicio.onModuleInit();
    const rutaEstado = join(vigente.destino, 'execution.json');
    const rutaJob = join(vigente.destino, 'job.json');
    const estadoAnterior = JSON.parse(await readFile(rutaEstado, 'utf8'));
    const jobAnterior = JSON.parse(await readFile(rutaJob, 'utf8'));
    const guardarOriginal = (servicio as any).guardar.bind(servicio);
    let fallo = false;
    const guardar = jest
      .spyOn(servicio as any, 'guardar')
      .mockImplementation(async (...args: unknown[]) => {
        const [destino, nombre, valor] = args as [string, string, any];
        if (
          !fallo &&
          destino === vigente.destino &&
          nombre === 'execution.json' &&
          valor.status === 'queued'
        ) {
          fallo = true;
          throw new Error('No se pudo persistir la reanudación');
        }
        return guardarOriginal(destino, nombre, valor);
      });
    await expect(servicio.reanudar(vigente.id, propietario)).rejects.toThrow(
      'No se pudo persistir la reanudación'
    );
    guardar.mockRestore();
    expect(fallo).toBe(true);
    expect(JSON.parse(await readFile(rutaEstado, 'utf8'))).toEqual(estadoAnterior);
    expect(JSON.parse(await readFile(rutaJob, 'utf8'))).toEqual(jobAnterior);
    expect(JSON.parse(await readFile(join(trabajos, 'queue.json'), 'utf8')).pendientes).toEqual([]);
    expect((servicio as any).cola).toEqual([]);
    expect((await servicio.consultar(vigente.id, propietario)).estado).toBe('failed');
    expect(await readFile(join(vigente.destino, 'parcial.pdf'))).toEqual(pdf);
  });
});
