import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import request = require('supertest');
import { Readable } from 'node:stream';
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
  const consultarEjecucion = jest.fn();
  const listar = jest.fn();
  const archivos = jest.fn();
  const token = jwt.sign({ passWasReset: false }, 'reportes-test-key');

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [GeneradorReportesController],
      providers: [
        { provide: GeneradorReportesImpl, useValue: { consultar } },
        {
          provide: EjecucionesReportesImpl,
          useValue: { crear, consultar: consultarEjecucion, listar, archivo: jest.fn(), archivos },
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
    crear.mockReset().mockResolvedValue({ id: 'job-test', estado: 'starting' });
    consultarEjecucion.mockReset().mockResolvedValue({ id: 'job-test', estado: 'complete' });
    listar.mockReset().mockResolvedValue([]);
    archivos
      .mockReset()
      .mockImplementation(async () => ({
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
        .query({ documento: ' 001234 ' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200, { paciente: null, ingresos: [] });
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
      .query(busqueda)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('genera solo para un ingreso del paciente y conserva la cédula como texto', async () => {
    consultar.mockResolvedValue({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 20 }],
    });
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ documento: ' 001234 ', ingreso: '20' })
      .expect(201, { id: 'job-test', estado: 'starting' });
    expect(crear).toHaveBeenCalledWith('001234', '20', {
      usuario: 7,
      contexto: 'ALTACENTRO',
      esDinamica: true,
    });
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
    listar.mockResolvedValue([reporte]);
    const respuesta = await request(app.getHttpServer())
      .get('/v1/generador-reportes?documento=001234')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(respuesta.body.ingresos).toEqual([
      { consecutivo: 20, reportes: reporte },
      { consecutivo: 19 },
    ]);
    expect(listar).toHaveBeenCalledWith('001234', ['20', '19'], {
      usuario: 7,
      contexto: 'ALTACENTRO',
      esDinamica: true,
    });
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
      .send({ documento: '001234', ingreso: '20' })
      .expect(400);
    expect(crear).not.toHaveBeenCalled();
  });

  it.each([
    { documento: '123', ingreso: '../20' },
    { documento: '123', ingreso: 20 },
    { documento: '123' },
  ])('valida la solicitud de generación %p', async datos => {
    await request(app.getHttpServer())
      .post('/v1/generador-reportes/ejecuciones')
      .set('Authorization', `Bearer ${token}`)
      .send(datos)
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
