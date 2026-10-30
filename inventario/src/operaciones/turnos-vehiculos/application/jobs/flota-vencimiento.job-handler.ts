import { gcmContextFactory } from '@common/domain/types';
import {
  DeferredJobExecution,
  DeferredJobHandler,
  PermanentJobError,
} from '@inn/core/deferred-jobs/domain';
import { DeferredJobHandlerRegistry, TenantScopeRunner } from '@inn/core/deferred-jobs/application';
import { VENCIMIENTO_JOB_NAMESPACE } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  VencimientoJobPayload,
  VencimientoProgramacionService,
} from '../services/vencimiento-programacion.service';

/**
 * Handler del namespace 'flota.vencimiento'. Solo traduce el job a una llamada de aplicación
 * dentro del tenant correcto; las reglas viven en `VencimientoService` y en la política.
 * Es un provider estático (sin dependencias request-scoped) para poder registrarse al inicio.
 */
@Injectable()
export class FlotaVencimientoJobHandler
  implements DeferredJobHandler<VencimientoJobPayload>, OnModuleInit
{
  readonly namespace = VENCIMIENTO_JOB_NAMESPACE;
  private readonly logger = new Logger(FlotaVencimientoJobHandler.name);

  constructor(
    private readonly registry: DeferredJobHandlerRegistry,
    private readonly runner: TenantScopeRunner,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async handle(execution: DeferredJobExecution<VencimientoJobPayload>): Promise<void> {
    let context;
    try {
      context = gcmContextFactory(execution.scope as never);
    } catch {
      throw new PermanentJobError(`Tenant desconocido en el job: ${execution.scope}`);
    }

    const decision = await this.runner.run(context, VencimientoProgramacionService, service =>
      service.procesarJob(execution.payload),
    );
    this.logger.log(
      `Job ${execution.key} [${execution.scope}] intento ${execution.attempt}/${execution.maxAttempts}: ${decision}`,
    );
  }
}
