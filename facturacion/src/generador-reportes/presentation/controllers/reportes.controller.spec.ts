import { INestApplication, ServiceUnavailableException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import request = require('supertest');
import { Readable } from 'node:stream';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HistorialReportesDto } from '../dtos/historial.dto';
import { fetchAuthsByUser } from '@common/infrastructure/services';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { GeneradorReportesController } from './reportes.controller';
import { GeneradorReportesImpl } from '../../infrastructure/services/reportes.impl';
import { EjecucionesReportesImpl } from '../../infrastructure/services/ejecuciones.impl';

jest.mock('@env', () => ({
  processEnv: { PRODUCTION: true, JWT_SECRET_KEY: 'reportes-test-key' },
}));
jest.mock('@common/infrastructure/services/base.source', () => ({ BaseSource: class {} }));
jest.mock('@common/infrastructure/services', () => ({ fetchAuthsByUser: jest.fn() }));
jest.mock('@common/application/services', () => ({
  JWTServices: {
    decodeToken: (token: string) => ({
      ...require('jsonwebtoken').decode(token),
      user: { id: 7 },
      context: { getCode: () => 'ALTACENTRO' },
      isDim: true,
    }),
  },
}));

describe('GET /v1/generador-reportes (HTTP y guardas reales)', () => {
  let app: INestApplication;
  const consultar = jest.fn();
  const crear = jest.fn();
  const reanudar = jest.fn();
  const consultarEjecucion = jest.fn();
  const listar = jest.fn();
  const consultarCola = jest.fn();
  const listarGenerados = jest.fn();
  const archivos = jest.fn();
  const token = jwt.sign({ passWasReset: false }, 'reportes-test-key');

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [GeneradorReportesController],
      providers: [
        { provide: GeneradorReportesImpl, useValue: { consultar } },
        {
          provide: EjecucionesReportesImpl,
          useValue: {
            crear,
            reanudar,
            consultar: consultarEjecucion,
            listar,
            consultarCola,
            listarGenerados,
            archivo: jest.fn(),
            archivos,
          },
        },
      ],
    }).compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    consultar.mockReset().mockResolvedValue({ paciente: null, ingresos: [] });
    crear.mockReset().mockResolvedValue({ id: 'job-test', estado: 'queued', posicionCola: 2 });
    reanudar.mockReset().mockResolvedValue({ id: 'job-test', estado: 'queued', posicionCola: 3 });
    consultarEjecucion.mockReset().mockResolvedValue({ id: 'job-test', estado: 'complete' });
    listar.mockReset().mockResolvedValue([]);
    consultarCola.mockReset().mockResolvedValue({
      trabajos: [],
      totalEnCola: 0,
      resumen: { total: 0, procesados: 0, enCurso: 0, pendientes: 0, porcentaje: 0 },
    });
    listarGenerados
      .mockReset()
      .mockResolvedValue({ reportes: [], total: 0, pagina: 1, porPagina: 10 });
    archivos.mockReset().mockImplementation(async () => ({
      contenido: Readable.from([Buffer.from('ZIP de prueba')]),
      nombre: 'reportes-ingreso-20.zip',
    }));
    (fetchAuthsByUser as jest.Mock).mockReset().mockResolvedValue({ onlyCodes: ['004006001'] });
  });

  it('exige una sesión válida', async () => {
    await request(app.getHttpServer()).get('/v1/generador-reportes?documento=123').expect(401);
    await request(app.getHttpServer())
      .get('/v1/generador-reportes?documento=123')
      .set('Authorization', 'Bearer falso')
      .expect(401);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('consulta solo la cola del propietario de sesión y conserva puestos globales', async () => {
    const cola = {
      trabajos: [
        {
          id: 'job-propio',
          documento: '001234',
          ingreso: '20',
          proceso: 'concurrente',
          estado: 'queued',
          posicionCola: 4,
          enColaDesde: '2026-10-27T15:00:00.000Z',
          loteId: 'lote-propio',
        },
        {
          id: 'job-activo',
          documento: '005678',
          ingreso: '21',
          proceso: 'pre-envio',
          estado: 'running',
        },
      ],
      totalEnCola: 5,
      resumen: { total: 2, procesados: 0, enCurso: 1, pendientes: 1, porcentaje: 0 },
    };
    consultarCola.mockResolvedValue(cola);
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/cola')
      .query({ usuario: '8', contexto: 'SANJUAN', esDinamica: 'false', propietario: 'ajeno' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200, cola)
      .expect('Cache-Control', 'no-store');
    expect(consultarCola).toHaveBeenCalledTimes(1);
    expect(consultarCola).toHaveBeenCalledWith({
      usuario: 7,
      contexto: 'ALTACENTRO',
      esDinamica: true,
    });
    expect(consultarEjecucion).not.toHaveBeenCalled();
    expect(consultar).not.toHaveBeenCalled();
  });

  it('exige sesión y permiso del generador para consultar la cola', async () => {
    await request(app.getHttpServer()).get('/v1/generador-reportes/cola').expect(401);
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/cola')
      .set('Authorization', 'Bearer falso')
      .expect(401);
    (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: [] });
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/cola')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expect(consultarCola).not.toHaveBeenCalled();
  });

  it('consulta la primera página de generados por defecto y conserva el historial vacío', async () => {
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, { reportes: [], total: 0, pagina: 1, porPagina: 10 })
      .expect('Cache-Control', 'no-store');
    expect(listarGenerados).toHaveBeenCalledWith(
      { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true },
      1,
      {}
    );
    expect(consultar).not.toHaveBeenCalled();
  });

  it('transforma la página a entero y solo admite el propietario de sesión para generados', async () => {
    const historial = { reportes: [], total: 25, pagina: 2, porPagina: 10 };
    listarGenerados.mockResolvedValue(historial);
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .query({ pagina: '2', porPagina: 1, usuario: 8, contexto: 'SANJUAN', propietario: 'ajeno' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200, historial);
    expect(listarGenerados).toHaveBeenCalledTimes(1);
    expect(listarGenerados).toHaveBeenCalledWith(
      { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true },
      2,
      {}
    );
  });

  it('recorta la búsqueda de generados y conserva el propietario de sesión al enviarla al servicio', async () => {
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .query({ pagina: '2', busqueda: '  001234  ', propietario: 'ajeno', porPagina: 100 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listarGenerados).toHaveBeenCalledWith(
      { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true },
      2,
      { busqueda: '001234' }
    );
  });

  it.each(['', '   '])('acepta la búsqueda vacía de generados %p', async busqueda => {
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .query({ busqueda })
      .set('Authorization', `Bearer ${token}`)
      .expect(200, { reportes: [], total: 0, pagina: 1, porPagina: 10 });
    expect(listarGenerados).toHaveBeenCalledWith(
      { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true },
      1,
      {}
    );
  });

  it('envía los filtros separados recortados y conserva los ceros iniciales', async () => {
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .query({
        pagina: '2',
        documento: ' 001234 ',
        ingreso: ' 0020 ',
        proceso: ' pre-envio ',
        archivo: ' notas-enfermeria ',
        busqueda: ' clinico ',
        usuario: 8,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listarGenerados).toHaveBeenCalledWith(
      { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true },
      2,
      {
        documento: '001234',
        ingreso: '0020',
        proceso: 'pre-envio',
        archivo: 'notas-enfermeria',
        busqueda: 'clinico',
      }
    );
  });

  it('omite todos los filtros vacíos del objeto enviado al servicio', async () => {
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .query({ documento: ' ', ingreso: '', proceso: ' ', archivo: '  ', busqueda: '' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200, { reportes: [], total: 0, pagina: 1, porPagina: 10 });
    expect(listarGenerados).toHaveBeenCalledWith(
      { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true },
      1,
      {}
    );
  });

  it.each(['pre-envio', 'concurrente', 'conciliacion', 'anteriores'])(
    'acepta el filtro de proceso de generados %s',
    async proceso => {
      await request(app.getHttpServer())
        .get('/v1/generador-reportes/generados')
        .query({ proceso })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(listarGenerados).toHaveBeenCalledWith(
        { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true },
        1,
        { proceso }
      );
    }
  );

  it.each([
    { documento: '12a' },
    { ingreso: '1.5' },
    { documento: '1'.repeat(21) },
    { ingreso: '1'.repeat(21) },
    { proceso: 'otro' },
    { proceso: 'Facturado' },
    { archivo: 'a'.repeat(101) },
    { documento: ['001', '002'] },
    { ingreso: ['1', '2'] },
    { proceso: ['pre-envio', 'concurrente'] },
    { archivo: ['HC', 'Notas'] },
  ])('rechaza filtros HTTP inválidos de generados %p', async filtros => {
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .query(filtros)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(listarGenerados).not.toHaveBeenCalled();
    expect(consultar).not.toHaveBeenCalled();
  });

  it.each(['documento', 'ingreso', 'proceso', 'archivo'])(
    'rechaza objetos, arreglos y números en el filtro DTO %s',
    async campo => {
      for (const valor of [{ valor: '001234' }, ['001', '002'], 123]) {
        const dto = plainToInstance(HistorialReportesDto, { [campo]: valor });
        const errores = await validate(dto);
        expect(errores.some(error => error.property === campo)).toBe(true);
      }
    }
  );

  it.each([[['HC', 'Notas']], ['a'.repeat(101)]])(
    'rechaza búsqueda HTTP inválida de generados %p antes de consultar archivos',
    async busqueda => {
      await request(app.getHttpServer())
        .get('/v1/generador-reportes/generados')
        .query({ busqueda })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(listarGenerados).not.toHaveBeenCalled();
      expect(consultar).not.toHaveBeenCalled();
    }
  );

  it.each([[['HC', 'Notas']], [{ documento: '001234' }], ['a'.repeat(101)]])(
    'valida que busqueda sea texto y no un objeto o arreglo: %p',
    async busqueda => {
      const dto = plainToInstance(HistorialReportesDto, { busqueda });
      const errores = await validate(dto);
      expect(errores.some(error => error.property === 'busqueda')).toBe(true);
    }
  );

  it('exige sesión y permiso del generador para consultar generados', async () => {
    await request(app.getHttpServer()).get('/v1/generador-reportes/generados').expect(401);
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .set('Authorization', 'Bearer falso')
      .expect(401);
    (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: [] });
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expect(listarGenerados).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, 'abc', '', 100001, ['1', '2']])(
    'rechaza la página inválida de generados %p antes de leer los archivos',
    async pagina => {
      await request(app.getHttpServer())
        .get('/v1/generador-reportes/generados')
        .query({ pagina })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(listarGenerados).not.toHaveBeenCalled();
      expect(consultar).not.toHaveBeenCalled();
    }
  );

  it('conserva los PDF de generados parciales y anteriores sin atribuirles disponibilidad', async () => {
    const historial = {
      reportes: [
        {
          id: 'parcial',
          documento: '001234',
          ingreso: '20',
          proceso: 'pre-envio',
          estado: 'failed',
          disponibleParaProceso: false,
          documentosPendientes: ['enfermeria'],
          archivos: [{ id: '0', nombre: 'historia.pdf' }],
        },
        {
          id: 'anterior',
          documento: '005678',
          ingreso: '21',
          estado: 'complete',
          disponibleParaProceso: false,
          documentosPendientes: [],
          reanudable: false,
          archivos: [{ id: '1', nombre: 'enfermeria-anterior.pdf' }],
        },
      ],
      total: 2,
      pagina: 1,
      porPagina: 10,
    };
    listarGenerados.mockResolvedValue(historial);
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, historial);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('revalida generados completos sin alterar archivos, página ni total del historial', async () => {
    const base = {
      documento: '001234',
      estado: 'complete',
      disponibleParaProceso: true,
      documentosPendientes: [],
      archivos: [{ id: '0', nombre: 'historia.pdf' }],
    };
    const reportes = [
      { ...base, id: 'preenvio', ingreso: '20', proceso: 'pre-envio' },
      { ...base, id: 'concurrente', ingreso: '21', proceso: 'concurrente' },
    ];
    const historial = { reportes, total: 22, pagina: 2, porPagina: 10 };
    listarGenerados.mockResolvedValue(historial);
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [
        { consecutivo: 20, estado: 'Facturado', activo: false },
        { consecutivo: 21, estado: 'Registrado', activo: true },
      ],
    });
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados?pagina=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, {
        ...historial,
        reportes: [{ ...reportes[0], disponibleParaProceso: false }, reportes[1]],
      });
    expect(consultar).toHaveBeenCalledTimes(1);
    expect(consultar).toHaveBeenCalledWith('001234');
  });

  it('propaga HTTP 503 cuando no puede revalidar la disponibilidad del historial', async () => {
    listarGenerados.mockResolvedValue({
      reportes: [
        {
          id: 'listo',
          documento: '001234',
          ingreso: '20',
          proceso: 'pre-envio',
          estado: 'complete',
          disponibleParaProceso: true,
          archivos: [{ id: '0', nombre: 'historia.pdf' }],
        },
      ],
      total: 1,
      pagina: 1,
      porPagina: 10,
    });
    consultar.mockRejectedValue(
      new ServiceUnavailableException('No fue posible consultar el paciente.')
    );
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/generados')
      .set('Authorization', `Bearer ${token}`)
      .expect(503);
  });

  it('revalida trabajos disponibles de cola por paciente sin alterar el resumen del procesamiento', async () => {
    const base = {
      documento: '001234',
      estado: 'complete',
      disponibleParaProceso: true,
      documentosPendientes: [],
      archivos: [{ id: '0', nombre: 'historia.pdf' }],
    };
    const trabajos = [
      { ...base, id: 'preenvio', ingreso: '20', proceso: 'pre-envio' },
      { ...base, id: 'concurrente', ingreso: '21', proceso: 'concurrente' },
      { ...base, id: 'desaparecido', ingreso: '22', proceso: 'concurrente' },
      {
        id: 'esperando',
        documento: '005678',
        ingreso: '30',
        proceso: 'concurrente',
        estado: 'queued',
        disponibleParaProceso: false,
      },
      {
        id: 'activo',
        documento: '009999',
        ingreso: '31',
        proceso: 'pre-envio',
        estado: 'running',
        disponibleParaProceso: false,
      },
    ];
    const cola = {
      trabajos,
      totalEnCola: 5,
      resumen: { total: 5, procesados: 3, enCurso: 1, pendientes: 1, porcentaje: 60 },
    };
    consultarCola.mockResolvedValue(cola);
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [
        { consecutivo: 20, estado: 'Facturado', activo: false },
        { consecutivo: 21, estado: 'Registrado', activo: true },
      ],
    });
    const resultado = await request(app.getHttpServer())
      .get('/v1/generador-reportes/cola')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(resultado.body).toEqual({
      ...cola,
      trabajos: [
        { ...trabajos[0], disponibleParaProceso: false },
        trabajos[1],
        { ...trabajos[2], disponibleParaProceso: false },
        trabajos[3],
        trabajos[4],
      ],
    });
    expect(consultar).toHaveBeenCalledTimes(1);
    expect(consultar).toHaveBeenCalledWith('001234');
  });

  it('devuelve HTTP 503 si falla la revalidación clínica de disponibilidad en cola', async () => {
    consultarCola.mockResolvedValue({
      trabajos: [
        {
          id: 'listo',
          documento: '001234',
          ingreso: '20',
          proceso: 'pre-envio',
          estado: 'complete',
          disponibleParaProceso: true,
          archivos: [],
        },
      ],
      totalEnCola: 0,
      resumen: { total: 1, procesados: 1, enCurso: 0, pendientes: 0, porcentaje: 100 },
    });
    consultar.mockRejectedValue(
      new ServiceUnavailableException('No fue posible consultar el paciente.')
    );
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/cola')
      .set('Authorization', `Bearer ${token}`)
      .expect(503);
    expect(consultar).toHaveBeenCalledTimes(1);
  });

  it('acepta solicitudes sucesivas en cola sin tomar propietario ni puesto del cuerpo del cliente', async () => {
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [
        { consecutivo: 20, estado: 'Registrado', activo: true },
        { consecutivo: 21, estado: 'Registrado', activo: true },
      ],
    });
    for (const ingreso of ['20', '21']) {
      await request(app.getHttpServer())
        .post('/v1/generador-reportes/ejecuciones')
        .set('Authorization', `Bearer ${token}`)
        .send({
          documento: '001234',
          ingreso,
          proceso: 'concurrente',
          propietario: { usuario: 8, contexto: 'SANJUAN', esDinamica: false },
          posicionCola: 1,
        })
        .expect(201, { id: 'job-test', estado: 'queued', posicionCola: 2 });
      expect(crear).toHaveBeenLastCalledWith(
        '001234',
        ingreso,
        { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true },
        'concurrente'
      );
    }
    expect(crear).toHaveBeenCalledTimes(2);
  });

  it('reanuda con sesión, permiso y el ingreso validado de la ejecución original', async () => {
    consultarEjecucion.mockResolvedValue({
      id: 'job-test',
      documento: '001234',
      ingreso: '20',
      estado: 'failed',
      proceso: 'pre-envio',
    });
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 20 }],
    });
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones/job-test/reanudar')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201, { id: 'job-test', estado: 'queued', posicionCola: 3 });
    expect(reanudar).toHaveBeenCalledWith('job-test', {
      usuario: 7,
      contexto: 'ALTACENTRO',
      esDinamica: true,
    });
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 21 }],
    });
    reanudar.mockClear();
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones/job-test/reanudar')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
    expect(reanudar).not.toHaveBeenCalled();
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones/job-test/reanudar')
      .send({})
      .expect(401);
    (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: [] });
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones/job-test/reanudar')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(403);
  });

  it('entrega el ZIP con sesión, permiso y propietario de la ejecución', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/v1/generador-reportes/ejecuciones/job-test/archivos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(respuesta.headers['content-type']).toContain('application/zip');
    expect(respuesta.headers['content-disposition']).toContain('reportes-ingreso-20.zip');
    expect(respuesta.headers['cache-control']).toBe('no-store');
    expect(archivos).toHaveBeenCalledWith('job-test', {
      usuario: 7,
      contexto: 'ALTACENTRO',
      esDinamica: true,
    });
  });

  it('rechaza la descarga conjunta sin sesión o permiso', async () => {
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/ejecuciones/job-test/archivos')
      .expect(401);
    (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: [] });
    await request(app.getHttpServer())
      .get('/v1/generador-reportes/ejecuciones/job-test/archivos')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expect(archivos).not.toHaveBeenCalled();
  });

  it.each([
    { permisos: [] },
    { permisos: ['004'] },
    { permisos: ['004006'] },
    { permisos: ['004005001'] },
  ])('deniega permisos ajenos o insuficientes $permisos', async ({ permisos }) => {
    (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: permisos });
    await request(app.getHttpServer())
      .get('/v1/generador-reportes?documento=123')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expect(consultar).not.toHaveBeenCalled();
  });

  it.each([{ permisos: ['004006001'] }, { permisos: [ADMIN_AUTHORITY] }])(
    'permite el permiso propio o administrador $permisos',
    async ({ permisos }) => {
      (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: permisos });
      await request(app.getHttpServer())
        .get('/v1/generador-reportes')
        .query({ documento: ' 001234 ', proceso: 'pre-envio' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200, { paciente: null, ingresos: [], proceso: 'pre-envio' });
      expect(consultar).toHaveBeenCalledWith('001234');
    }
  );

  it.each([
    {},
    { documento: '' },
    { documento: '12a' },
    { documento: '1'.repeat(21) },
    { documento: ['123', '456'] },
  ])('valida el DTO de búsqueda %p', async busqueda => {
    await request(app.getHttpServer())
      .get('/v1/generador-reportes')
      .query({ proceso: 'pre-envio', ...busqueda })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(consultar).not.toHaveBeenCalled();
  });

  it.each(['Facturado', ' FACTURADO '])(
    'bloquea generación y reanudación de pre-envío cuando el ingreso es %s',
    async estado => {
      consultar.mockResolvedValue({
        paciente: { documento: '001234' },
        ingresos: [{ consecutivo: 20, estado }],
      });
      consultarEjecucion.mockResolvedValue({
        id: 'job-test',
        documento: '001234',
        ingreso: '20',
        estado: 'failed',
        proceso: 'pre-envio',
      });
      for (const ruta of [
        '/v1/generador-reportes/ejecuciones',
        '/v1/generador-reportes/ejecuciones/job-test/reanudar',
      ]) {
        await request(app.getHttpServer())
          .post(ruta)
          .set('Authorization', `Bearer ${token}`)
          .send({ documento: '001234', ingreso: '20', proceso: 'pre-envio' })
          .expect(400)
          .expect(({ body }) => {
            expect(body.message).toBe('Ingreso facturado: no disponible para auditoría pre-envío');
          });
      }
      expect(crear).not.toHaveBeenCalled();
      expect(reanudar).not.toHaveBeenCalled();
    }
  );

  it('genera solo para un ingreso del paciente y conserva la cédula como texto', async () => {
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 20 }],
    });
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ documento: ' 001234 ', ingreso: '20', proceso: 'pre-envio' })
      .expect(201, { id: 'job-test', estado: 'queued', posicionCola: 2 });
    expect(crear).toHaveBeenCalledWith(
      '001234',
      '20',
      {
        usuario: 7,
        contexto: 'ALTACENTRO',
        esDinamica: true,
      },
      'pre-envio'
    );
  });

  it('la búsqueda asocia reportes guardados al ingreso correspondiente sin generar otra ejecución', async () => {
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 20 }, { consecutivo: 19 }],
    });
    const reporte = {
      id: 'guardado',
      ingreso: '20',
      estado: 'complete',
      archivos: [{ id: '0', nombre: 'grupo.pdf' }],
    };
    const anterior = { ...reporte, id: 'anterior' };
    listar.mockImplementation(async (_documento, _ingresos, _propietario, proceso) =>
      proceso === null ? [anterior] : [reporte]
    );
    const respuesta = await request(app.getHttpServer())
      .get('/v1/generador-reportes?documento=001234&proceso=pre-envio')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(respuesta.body.ingresos).toEqual([
      { consecutivo: 20, reportes: reporte, reportesAnteriores: anterior },
      { consecutivo: 19 },
    ]);
    const propietario = { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true };
    expect(listar).toHaveBeenCalledWith('001234', ['20', '19'], propietario, 'pre-envio');
    expect(listar).toHaveBeenCalledWith('001234', ['20', '19'], propietario, null);
    expect(crear).not.toHaveBeenCalled();
    expect(respuesta.headers['cache-control']).toBe('no-store');
  });

  it('rechaza un ingreso de otro paciente antes de ejecutar el navegador', async () => {
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 19 }],
    });
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ documento: '001234', ingreso: '20', proceso: 'pre-envio' })
      .expect(400);
    expect(crear).not.toHaveBeenCalled();
  });

  it('retira disponibilidad de pre-envío cuando el ingreso guardado pasó a Facturado sin ocultar sus PDF', async () => {
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 20, estado: 'Facturado', activo: false }],
    });
    const reporte = {
      id: 'guardado',
      ingreso: '20',
      proceso: 'pre-envio',
      estado: 'complete',
      disponibleParaProceso: true,
      documentosPendientes: [],
      archivos: [{ id: '0', nombre: 'prefactura.pdf' }],
      pendiente: {
        id: 'posterior',
        disponibleParaProceso: true,
        archivos: [{ id: '0', nombre: 'historia.pdf' }],
      },
    };
    listar.mockImplementation(async (_documento, _ingresos, _propietario, proceso) =>
      proceso === 'pre-envio' ? [reporte] : []
    );
    const resultado = await request(app.getHttpServer())
      .get('/v1/generador-reportes')
      .query({ documento: '001234', proceso: 'pre-envio' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(resultado.body.ingresos[0].reportes).toEqual({
      ...reporte,
      disponibleParaProceso: false,
      pendiente: { ...reporte.pendiente, disponibleParaProceso: false },
    });
    expect(reporte.disponibleParaProceso).toBe(true);
  });

  it.each([
    { proceso: 'pre-envio', esperados: [20, 19, 18, 17, 16] },
    { proceso: 'concurrente', esperados: [20] },
    { proceso: 'conciliacion', esperados: [19] },
  ])(
    'filtra los ingresos de la búsqueda $proceso sin mezclar estados',
    async ({ proceso, esperados }) => {
      consultar.mockResolvedValue({
        paciente: { documento: '001234' },
        ingresos: [
          { consecutivo: 20, estado: 'Registrado', activo: true },
          { consecutivo: 19, estado: ' Facturado ', activo: true },
          { consecutivo: 18, estado: 'Cerrado', activo: true },
          { consecutivo: 17, estado: 'Anulado', activo: true },
          { consecutivo: 16, estado: 'Registrado', activo: false },
        ],
      });
      const resultado = await request(app.getHttpServer())
        .get('/v1/generador-reportes')
        .query({ documento: '001234', proceso })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(resultado.body.proceso).toBe(proceso);
      expect(resultado.body.ingresos.map(ingreso => ingreso.consecutivo)).toEqual(esperados);
      const propietario = { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true };
      expect(listar).toHaveBeenCalledWith('001234', esperados.map(String), propietario, proceso);
    }
  );

  it('conserva el paciente si no tiene ingresos elegibles para concurrente', async () => {
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 20, estado: 'Facturado', activo: false }],
    });
    const resultado = await request(app.getHttpServer())
      .get('/v1/generador-reportes')
      .query({ documento: '001234', proceso: 'concurrente' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(resultado.body).toEqual({
      paciente: { documento: '001234' },
      ingresos: [],
      proceso: 'concurrente',
    });
    expect(listar).not.toHaveBeenCalled();
  });

  it.each([
    { proceso: 'concurrente', estado: 'Registrado', activo: true },
    { proceso: 'conciliacion', estado: 'Facturado', activo: false },
  ])('genera con el proceso $proceso explícito', async ({ proceso, estado, activo }) => {
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 20, estado, activo }],
    });
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones')
      .send({ documento: '001234', ingreso: '20', proceso })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(crear).toHaveBeenCalledWith(
      '001234',
      '20',
      { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true },
      proceso
    );
  });

  it.each([
    { proceso: 'concurrente', estado: 'Registrado', activo: false },
    { proceso: 'concurrente', estado: 'Facturado', activo: true },
    { proceso: 'concurrente', estado: 'Cerrado', activo: true },
    { proceso: 'concurrente', estado: 'Anulado', activo: true },
    { proceso: 'conciliacion', estado: 'Registrado', activo: true },
    { proceso: 'conciliacion', estado: 'Cerrado', activo: false },
  ])(
    'revalida elegibilidad de $proceso para $estado antes de generar o reanudar',
    async ({ proceso, estado, activo }) => {
      consultar.mockResolvedValue({
        paciente: { documento: '001234' },
        ingresos: [{ consecutivo: 20, estado, activo }],
      });
      consultarEjecucion.mockResolvedValue({
        id: 'job-test',
        documento: '001234',
        ingreso: '20',
        estado: 'failed',
        proceso,
      });
      for (const ruta of ['/ejecuciones', '/ejecuciones/job-test/reanudar']) {
        await request(app.getHttpServer())
          .post('/v1/generador-reportes' + ruta)
          .send({ documento: '001234', ingreso: '20', proceso })
          .set('Authorization', `Bearer ${token}`)
          .expect(400);
      }
      expect(crear).not.toHaveBeenCalled();
      expect(reanudar).not.toHaveBeenCalled();
    }
  );

  it('reanuda usando el proceso almacenado aunque el cuerpo solicite otro', async () => {
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 20, estado: 'Facturado', activo: false }],
    });
    consultarEjecucion.mockResolvedValue({
      id: 'job-test',
      documento: '001234',
      ingreso: '20',
      estado: 'failed',
      proceso: 'conciliacion',
    });
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones/job-test/reanudar')
      .send({ proceso: 'pre-envio' })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(reanudar).toHaveBeenCalledWith('job-test', {
      usuario: 7,
      contexto: 'ALTACENTRO',
      esDinamica: true,
    });
  });

  it('mantiene ejecuciones anteriores sin proceso de solo consulta', async () => {
    consultarEjecucion.mockResolvedValue({
      id: 'job-test',
      documento: '001234',
      ingreso: '20',
      estado: 'failed',
    });
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones/job-test/reanudar')
      .send({ proceso: 'concurrente' })
      .set('Authorization', `Bearer ${token}`)
      .expect(409);
    expect(consultar).not.toHaveBeenCalled();
    expect(reanudar).not.toHaveBeenCalled();
  });

  it.each([
    { estado: 'Registrado', esperado: true },
    { estado: 'Facturado', esperado: false },
    { estado: null, esperado: false },
  ])(
    'revalida la disponibilidad terminal al consultar estado con ingreso $estado',
    async ({ estado, esperado }) => {
      const ejecucion = {
        id: 'job-test',
        documento: '001234',
        ingreso: '20',
        proceso: 'pre-envio',
        estado: 'complete',
        disponibleParaProceso: true,
        documentosPendientes: [],
        archivos: [{ id: '0', nombre: 'prefactura.pdf' }],
      };
      consultarEjecucion.mockResolvedValue(ejecucion);
      consultar.mockResolvedValue({
        paciente: { documento: '001234' },
        ingresos: estado === null ? [] : [{ consecutivo: 20, estado }],
      });
      const resultado = await request(app.getHttpServer())
        .get('/v1/generador-reportes/ejecuciones/job-test')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(resultado.body).toEqual({ ...ejecucion, disponibleParaProceso: esperado });
      expect(consultar).toHaveBeenCalledWith('001234');
    }
  );

  it.each(['queued', 'running', 'starting', 'failed', 'complete'])(
    'no repite consulta clínica durante seguimiento %s sin disponibilidad',
    async estado => {
      const ejecucion = {
        id: 'job-test',
        documento: '001234',
        ingreso: '20',
        proceso: 'pre-envio',
        estado,
        disponibleParaProceso: false,
        documentosPendientes: ['prefactura'],
        archivos: [],
      };
      consultarEjecucion.mockResolvedValue(ejecucion);
      await request(app.getHttpServer())
        .get('/v1/generador-reportes/ejecuciones/job-test')
        .set('Authorization', `Bearer ${token}`)
        .expect(200, ejecucion);
      expect(consultar).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, '', 'otro', ['concurrente', 'conciliacion'], null, 1])(
    'exige un proceso válido en búsqueda y generación: %p',
    async proceso => {
      const busqueda = { documento: '001234', ...(proceso === undefined ? {} : { proceso }) };
      await request(app.getHttpServer())
        .get('/v1/generador-reportes')
        .query(busqueda)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      await request(app.getHttpServer())
        .post('/v1/generador-reportes/ejecuciones')
        .send({ ...busqueda, ingreso: '20' })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(consultar).not.toHaveBeenCalled();
      expect(crear).not.toHaveBeenCalled();
    }
  );

  it.each([
    { documento: '123', ingreso: '../20' },
    { documento: '123', ingreso: 20 },
    { documento: '123' },
  ])('valida la solicitud de generación %p', async datos => {
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ proceso: 'pre-envio', ...datos })
      .expect(400);
    expect(crear).not.toHaveBeenCalled();
  });

  it('exige sesión y permiso también para generar, consultar el estado y descargar', async () => {
    for (const ruta of [
      '/v1/generador-reportes/ejecuciones/job-test',
      '/v1/generador-reportes/ejecuciones/job-test/archivos/0',
    ]) {
      await request(app.getHttpServer()).get(ruta).expect(401);
      (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: [] });
      await request(app.getHttpServer())
        .get(ruta)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    }
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones')
      .send({ documento: '123', ingreso: '20' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ documento: '123', ingreso: '20' })
      .expect(403);
    expect(crear).not.toHaveBeenCalled();
    expect(consultarEjecucion).not.toHaveBeenCalled();
  });
});
