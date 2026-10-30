import { GcmContextType } from '@common/domain/types';
import { RequestContext } from '@common/infrastructure/services';
import { processEnv } from '@env';
import { Injectable, Type } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

const SYSTEM_USER_ID = 0;
const SYSTEM_USER_NAME = 'SISTEMA';

/**
 * Ejecuta trabajo en segundo plano dentro de un tenant, sin petición HTTP.
 *
 * Los repositorios extienden `BaseSource`, que es request-scoped y deduce el DataSource del
 * JWT de la petición. Fuera de una petición (jobs, cron, arranque) se fabrica una "request"
 * mínima con un token de sistema que NUNCA sale del proceso ni se verifica ante terceros:
 * solo permite a `BaseSource` resolver el tenant. Cada llamada usa su propio contextId, así
 * que las instancias request-scoped no se comparten entre ejecuciones.
 */
@Injectable()
export class TenantScopeRunner {
  constructor(private readonly moduleRef: ModuleRef) {}

  async run<T, R>(
    context: GcmContextType,
    provider: Type<T> | symbol,
    work: (instance: T) => Promise<R>,
  ): Promise<R> {
    const contextId = ContextIdFactory.create();
    this.moduleRef.registerRequestByContextId(this.buildRequest(context), contextId);
    const instance = await this.moduleRef.resolve<T>(provider as Type<T>, contextId, {
      strict: false,
    });
    return RequestContext.run(
      {
        usuario: {
          id: SYSTEM_USER_ID,
          nombre: SYSTEM_USER_NAME,
          documento: '',
          table: 'GENUSUARIO',
          context,
        },
      },
      () => work(instance),
    );
  }

  private buildRequest(context: GcmContextType): { headers: Record<string, string> } {
    const token = jwt.sign(
      {
        jti: `${SYSTEM_USER_ID}`,
        sub: context.getCode(),
        dcm: '',
        fnm: SYSTEM_USER_NAME,
        tbl: 'GENUSUARIO',
      },
      processEnv.JWT_SECRET_KEY,
      { expiresIn: '5m', algorithm: 'HS512' },
    );
    return { headers: { authorization: `Bearer ${token}` } };
  }
}
