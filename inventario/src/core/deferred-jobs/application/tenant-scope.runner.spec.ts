import { JWTServices } from '@common/application/services';
import { GCM_CONTEXTS } from '@common/domain/types';
import { RequestContext } from '@common/infrastructure/services';
import { Inject, Injectable, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { TenantScopeRunner } from './tenant-scope.runner';

/** Imita a BaseSource: request-scoped, deduce el tenant del JWT de la "petición". */
@Injectable({ scope: Scope.REQUEST })
class Probe {
  constructor(@Inject(REQUEST) private readonly req: { headers: { authorization: string } }) {}
  tenant() {
    return JWTServices.decodeToken(this.req.headers.authorization.split(' ')[1]).context.getCode();
  }
}

@Module({ providers: [Probe, TenantScopeRunner] })
class TestModule {}

describe('TenantScopeRunner', () => {
  let runner: TenantScopeRunner;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestModule] }).compile();
    runner = moduleRef.get(TenantScopeRunner);
  });

  it('resuelve servicios request-scoped fuera de una petición, en el tenant pedido', async () => {
    const tenant = await runner.run(GCM_CONTEXTS.ALTACENTRO, Probe, p => Promise.resolve(p.tenant()));
    expect(tenant).toBe(GCM_CONTEXTS.ALTACENTRO.getCode());

    const otro = await runner.run(GCM_CONTEXTS.AGUACHICA, Probe, p => Promise.resolve(p.tenant()));
    expect(otro).toBe(GCM_CONTEXTS.AGUACHICA.getCode());
  });

  it('cada ejecución usa su propia instancia (no comparte estado entre tenants)', async () => {
    const instancias = await Promise.all([
      runner.run(GCM_CONTEXTS.ALTACENTRO, Probe, p => Promise.resolve(p)),
      runner.run(GCM_CONTEXTS.ALTACENTRO, Probe, p => Promise.resolve(p)),
    ]);
    expect(instancias[0]).not.toBe(instancias[1]);
  });

  it('expone un usuario de sistema en RequestContext durante el trabajo', async () => {
    const usuario = await runner.run(GCM_CONTEXTS.ALTACENTRO, Probe, () =>
      Promise.resolve(RequestContext.get().usuario),
    );
    expect(usuario.nombre).toBe('SISTEMA');
    expect(usuario.context).toBe(GCM_CONTEXTS.ALTACENTRO);
  });

  it('propaga los errores del trabajo', async () => {
    await expect(
      runner.run(GCM_CONTEXTS.ALTACENTRO, Probe, () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
  });
});
