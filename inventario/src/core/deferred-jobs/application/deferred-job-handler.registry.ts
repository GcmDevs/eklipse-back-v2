import { Injectable, Logger } from '@nestjs/common';
import { DeferredJobHandler } from '../domain';

/**
 * Registro de handlers por namespace. Cada módulo de negocio registra el suyo en
 * `onModuleInit`. También avisa cuando el backend de jobs vuelve a estar disponible
 * (p. ej. Redis reconectó) para que el negocio reconcilie.
 */
@Injectable()
export class DeferredJobHandlerRegistry {
  private readonly logger = new Logger(DeferredJobHandlerRegistry.name);
  private readonly handlers = new Map<string, DeferredJobHandler>();
  private readonly readyListeners: Array<() => void> = [];

  register(handler: DeferredJobHandler): void {
    if (this.handlers.has(handler.namespace)) {
      throw new Error(`Ya existe un handler para el namespace '${handler.namespace}'`);
    }
    this.handlers.set(handler.namespace, handler);
  }

  get(namespace: string): DeferredJobHandler | undefined {
    return this.handlers.get(namespace);
  }

  onBackendReady(listener: () => void): void {
    this.readyListeners.push(listener);
  }

  notifyBackendReady(): void {
    for (const listener of this.readyListeners) {
      try {
        listener();
      } catch (error) {
        this.logger.warn(`Listener de backend-ready falló: ${(error as Error).message}`);
      }
    }
  }
}
