import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import request = require('supertest');
import { fetchAuthsByUser } from '@common/infrastructure/services';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { GeneradorReportesController } from './reportes.controller';
import { GeneradorReportesImpl } from '../../infrastructure/services/reportes.impl';

jest.mock('@env', () => ({
  processEnv: { PRODUCTION: true, JWT_SECRET_KEY: 'reportes-test-key' },
}));
jest.mock('@common/infrastructure/services/base.source', () => ({ BaseSource: class {} }));
jest.mock('@common/infrastructure/services', () => ({ fetchAuthsByUser: jest.fn() }));
jest.mock('@common/application/services', () => ({
  JWTServices: { decodeToken: (token: string) => require('jsonwebtoken').decode(token) },
}));

describe('GET /v1/generador-reportes (HTTP y guardas reales)', () => {
  let app: INestApplication;
  const consultar = jest.fn();
  const token = jwt.sign({ passWasReset: false }, 'reportes-test-key');

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [GeneradorReportesController],
      providers: [{ provide: GeneradorReportesImpl, useValue: { consultar } }],
    }).compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    consultar.mockReset().mockResolvedValue({ paciente: null, ingresos: [] });
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
});
