import { UserRequest } from '@common/domain/types';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  usuario?: UserRequest;
}

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextData>();

  static run<T>(data: RequestContextData, fn: () => T): T {
    return this.storage.run(data, fn);
  }

  static get(): RequestContextData {
    const ctx = this.storage.getStore();
    if (!ctx) throw new Error('RequestContext no inicializado');
    return ctx;
  }

  static tryGet(): RequestContextData | undefined {
    return this.storage.getStore();
  }

  static setUsuario(usuario: UserRequest): void {
    const ctx = this.tryGet();
    if (ctx) ctx.usuario = usuario;
  }
}

export const getUser = (): UserRequest => {
  const usuario = RequestContext.get().usuario;
  if (!usuario) throw new Error('Usuario no disponible en RequestContext');
  return usuario;
}