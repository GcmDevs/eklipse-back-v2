import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip = require('jszip');
import { EjecucionesReportesImpl } from './ejecuciones.impl';

jest.mock('./consulta-cola.impl', () => ({ ConsultaColaReportesImpl: class {} }));

describe('Almacenamiento externo de AUDITOR-IA', () => {
  const original = { ...process.env };
  const propietario = { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true };
  let temporal: string;
  let codigo: string;
  let datos: string;
  let servicios: EjecucionesReportesImpl[];
  let servicio: EjecucionesReportesImpl;
  const consulta = {
    consultar: jest.fn(async (documento: string) => ({
      paciente: { documento },
      ingresos: [20, 21].map(consecutivo => ({
        consecutivo,
        estado: 'Registrado',
        activo: true,
        tipoIngreso: 'Urgencias',
      })),
    })),
  };

  function nuevo() {
    const creado = new EjecucionesReportesImpl(consulta as any);
    servicios.push(creado);
    return creado;
  }

  async function esperar(id: string, estado: string, instancia = servicio) {
    for (let intento = 0; intento < 100; intento++) {
      const resultado = await instancia.consultar(id, propietario);
      if (resultado.estado === estado) return resultado;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`No llegó a ${estado}`);
  }

  beforeEach(async () => {
    temporal = await mkdtemp(join(tmpdir(), 'auditor-ia-almacenamiento-'));
    codigo = join(temporal, 'codigo');
    datos = join(temporal, 'datos externos');
    servicios = [];
    process.env.EKLIPSE_AUTOMATION_DIR = codigo;
    process.env.EKLIPSE_AUTOMATION_DATA_DIR = datos;
    process.env.AUDITOR_BACKEND_ONLY = 'secreto-sintetico-del-backend';
    delete process.env.EKLIPSE_AUTOMATION_NODE;
    delete process.env.EKLIPSE_AUTOMATION_CONTEXT;
    delete process.env.EKLIPSE_AUTOMATION_TIMEOUT_MS;
    await mkdir(join(codigo, 'src'), { recursive: true });
    await writeFile(join(codigo, '.env'), 'AUTOMATION_ONLY=entorno-sintetico-del-ejecutor\n');
    // Solo guarda documentos sintéticos; no utiliza Playwright ni DG Web.
    await writeFile(
      join(codigo, 'src', 'worker.ts'),
      `
      const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
      const arg=key=>process.argv[process.argv.indexOf(key)+1];
      const folder=arg('--carpeta'),document=arg('--documento'),admission=arg('--ingreso');
      (async()=>{
        await fs.writeFile(path.join(folder,'entorno.json'),JSON.stringify({
          cwd:process.cwd(),data:process.env.EKLIPSE_AUTOMATION_DATA_DIR,
          automation:process.env.AUTOMATION_ONLY,backendSecretAbsent:!process.env.AUDITOR_BACKEND_ONLY
        }));
        const relativePath=path.join('reportes',document,admission,'historias-clinicas','hc.pdf');
        await fs.mkdir(path.dirname(path.join(folder,relativePath)),{recursive:true});
        const body=Buffer.from('%PDF-1.7 Documento sintético externo');
        await fs.writeFile(path.join(folder,relativePath),body);
        const state={process:arg('--proceso'),status:'running',message:'Descargando',updatedAt:new Date().toISOString(),completedStages:[],
          files:[{name:'hc.pdf',relativePath,bytes:body.length,sha256:crypto.createHash('sha256').update(body).digest('hex'),group:1,totalGroups:1,kind:'historias-clinicas'}]};
        const persist=()=>fs.writeFile(path.join(folder,'execution.json'),JSON.stringify(state));
        await persist();
        const completion=setTimeout(async()=>{clearInterval(cancel);state.status='complete';state.completedStages=['historias-clinicas'];await persist();},900);
        const cancel=setInterval(async()=>{
          try {await fs.access(path.join(folder,'cancel.json'));} catch {return;}
          clearInterval(cancel);clearTimeout(completion);state.status='cancelled';await persist();
        },30);
      })().catch(()=>{process.exitCode=1;});
    `
    );
    servicio = nuevo();
  });

  afterEach(async () => {
    for (const instancia of servicios) instancia.onModuleDestroy();
    for (
      let intento = 0;
      intento < 100 && servicios.some(instancia => (instancia as any).child);
      intento++
    )
      await new Promise(resolve => setTimeout(resolve, 50));
    for (const instancia of servicios) await (instancia as any).mutex;
    const destino = await realpath(temporal);
    expect(destino.startsWith(await realpath(tmpdir()))).toBe(true);
    await rm(destino, { recursive: true, force: true });
    process.env = { ...original };
  });

  it('separa código y datos, entrega PDF y ZIP y pasa solo la raíz permitida al ejecutor', async () => {
    const job = await servicio.crear('001234', '20', propietario, 'concurrente');
    const resultado = await esperar(job.id, 'complete');
    const carpeta = join(datos, 'artifacts', 'eklipse-jobs', job.id);
    expect(resultado.disponibleParaProceso).toBe(true);
    expect(JSON.parse(await readFile(join(carpeta, 'entorno.json'), 'utf8'))).toEqual({
      cwd: codigo,
      data: datos,
      automation: 'entorno-sintetico-del-ejecutor',
      backendSecretAbsent: true,
    });
    expect(JSON.parse(await readFile(join(carpeta, 'job.json'), 'utf8')).id).toBe(job.id);
    await expect(
      readFile(join(codigo, 'artifacts', 'eklipse-jobs', 'queue.json'))
    ).rejects.toMatchObject({ code: 'ENOENT' });
    const archivo = await servicio.archivo(job.id, '0', propietario);
    expect(archivo.ruta).toBe(
      await realpath(join(carpeta, 'reportes', '001234', '20', 'historias-clinicas', 'hc.pdf'))
    );
    expect(await readFile(archivo.ruta, 'utf8')).toContain('%PDF');
    expect((await servicio.archivo(job.id, '0', { ...propietario, usuario: 8 })).ruta).toBe(
      archivo.ruta
    );
    await expect(
      servicio.archivo(job.id, '0', { ...propietario, contexto: 'OTRA' })
    ).rejects.toBeInstanceOf(NotFoundException);
    const paquete = await servicio.archivos(job.id, propietario);
    const bloques: Buffer[] = [];
    for await (const bloque of paquete.contenido) bloques.push(Buffer.from(bloque));
    const zip = await JSZip.loadAsync(Buffer.concat(bloques));
    const pdf = Object.values(zip.files).filter(entrada => !entrada.dir);
    expect(pdf).toHaveLength(1);
    expect(await pdf[0].async('string')).toContain('%PDF');
    expect(JSON.stringify(resultado)).not.toContain(datos);
  });

  it('recupera la cola externa al reiniciar y conserva PDF al cancelar el turno activo', async () => {
    jest.spyOn(servicio as any, 'programar').mockImplementation(() => {});
    const primero = await servicio.crear('001234', '20', propietario, 'concurrente');
    const segundo = await servicio.crear('005678', '21', propietario, 'concurrente');
    expect(
      JSON.parse(await readFile(join(datos, 'artifacts', 'eklipse-jobs', 'queue.json'), 'utf8'))
        .pendientes
    ).toEqual([primero.id, segundo.id]);
    servicio.onModuleDestroy();
    const recuperado = nuevo();
    const pausa = jest.spyOn(recuperado as any, 'programar').mockImplementation(() => {});
    await recuperado.onModuleInit();
    expect(
      (await recuperado.consultarCola(propietario)).trabajos.map(trabajo => trabajo.id)
    ).toEqual([primero.id, segundo.id]);
    expect((await recuperado.consultarCola({ ...propietario, usuario: 8 })).trabajos).toEqual([]);
    pausa.mockRestore();
    (recuperado as any).programar();
    await esperar(primero.id, 'running', recuperado);
    const cancelado = await recuperado.cancelar(primero.id, propietario);
    expect(cancelado).toMatchObject({ estado: 'cancelled', reanudable: false });
    expect(cancelado.archivos).toHaveLength(1);
    const conservado = await recuperado.archivo(primero.id, '0', propietario);
    expect(await readFile(conservado.ruta, 'utf8')).toContain('%PDF');
    await esperar(segundo.id, 'complete', recuperado);
    const carpeta = join(datos, 'artifacts', 'eklipse-jobs', primero.id);
    expect(
      JSON.parse(await readFile(join(carpeta, 'cancel.json'), 'utf8')).requestedAt
    ).toBeTruthy();
    const lectura = nuevo();
    expect((await lectura.consultar(primero.id, propietario)).estado).toBe('cancelled');
    expect((await lectura.archivo(primero.id, '0', propietario)).ruta).toBe(conservado.ruta);
  });

  for (const ruta of ['datos-relativos', 'D:sin-raiz', '\\sin-unidad']) {
    it(`rechaza la raíz relativa ${ruta} sin guardar en la instalación`, async () => {
      process.env.EKLIPSE_AUTOMATION_DATA_DIR = ruta;
      await expect(
        servicio.crear('001234', '20', propietario, 'concurrente')
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(
        readFile(join(codigo, 'artifacts', 'eklipse-jobs', 'queue.json'))
      ).rejects.toMatchObject({ code: 'ENOENT' });
    });
  }

  it('no usa la instalación como alternativa cuando el almacenamiento no es accesible', async () => {
    await writeFile(datos, 'Un archivo impide crear la carpeta de datos.');
    await expect(servicio.crear('001234', '20', propietario, 'concurrente')).rejects.toThrow(
      'almacenamiento'
    );
    expect(await readFile(datos, 'utf8')).toContain('impide');
    await expect(
      readFile(join(codigo, 'artifacts', 'eklipse-jobs', 'queue.json'))
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
