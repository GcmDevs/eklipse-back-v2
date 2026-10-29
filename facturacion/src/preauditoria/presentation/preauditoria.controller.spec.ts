import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../app.module';
import { PreauditoriaService } from '../application/preauditoria.service';
import { initializeSources } from '@common/infrastructure/services/connections';
jest.mock('@env', () => ({
  processEnv: { PRODUCTION: true, JWT_SECRET_KEY: 'preauditoria-test-key' },
}));
jest.mock('@common/infrastructure/services/connections', () => ({
  EK_DS: {},
  initializeSources: jest.fn(),
}));
jest.mock('@common/infrastructure/services/base.source', () => ({ BaseSource: class {} }));
jest.mock('@common/application/services', () => ({ JWTServices: { decodeToken: jest.fn() } }));
describe('Registro en Facturación, contrato HTTP, validación y autenticación', () => {
  let app: INestApplication;
  const token = jwt.sign({ sub: 'ALTACENTRO' }, 'preauditoria-test-key');
  const servicio = {
    sesion: jest.fn().mockResolvedValue({ instalado: false }),
    recibir: jest.fn(),
    analizar: jest.fn(),
    accion: jest.fn(),
    vistaPrevia: jest.fn().mockResolvedValue({
      contenido: Buffer.from('%PDF-prueba'),
      token: '11111111-1111-4111-8111-111111111111',
    }),
  };
  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PreauditoriaService)
      .useValue(servicio)
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    expect(initializeSources).toHaveBeenCalledTimes(1);
  });
  afterAll(() => app.close());
  it('requiere un token firmado, incluso para consultar la instalación', async () => {
    await request(app.getHttpServer()).get('/v1/preauditoria/sesion').expect(401);
    await request(app.getHttpServer())
      .get('/v1/preauditoria/sesion')
      .set('Authorization', 'Bearer falso')
      .expect(401);
    await request(app.getHttpServer())
      .get('/v1/preauditoria/sesion')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ instalado: false });
  });
  it('rechaza recepciones incompletas antes de ejecutar el servicio', async () => {
    await request(app.getHttpServer())
      .post('/v1/preauditoria/auditorias')
      .set('Authorization', `Bearer ${token}`)
      .send({ valor: -1 })
      .expect(400);
    expect(servicio.recibir).not.toHaveBeenCalled();
  });
  it('recibe la prefactura multipart como Buffer en memoria', async () => {
    servicio.analizar.mockImplementation(async (ingreso, file) => ({
      ingreso,
      bytes: file.buffer.length,
      sinRuta: file.path === undefined,
    }));
    await request(app.getHttpServer())
      .post('/v1/preauditoria/prefacturas/analizar')
      .set('Authorization', `Bearer ${token}`)
      .field('ingreso', '1234')
      .attach('archivo', Buffer.from('%PDF-prueba'), 'prefactura.pdf')
      .expect(201)
      .expect({ ingreso: '1234', bytes: 11, sinRuta: true });
  });
  it('entrega la vista previa binaria, token de versión y política sin caché', async () => {
    const r = await request(app.getHttpServer())
      .get(
        '/v1/preauditoria/auditorias/11111111-1111-4111-8111-111111111111/vista-previa?version=1'
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(r.headers['content-type']).toContain('application/pdf');
    expect(r.headers['cache-control']).toBe('no-store');
    expect(r.headers['x-preauditoria-vista']).toBeTruthy();
  });
  it('no permite ejecutar acciones mediante GET', async () => {
    await request(app.getHttpServer())
      .get('/v1/preauditoria/auditorias/11111111-1111-4111-8111-111111111111/acciones')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(servicio.accion).not.toHaveBeenCalled();
  });
});
