import { GCM_CONTEXTS } from '@common/domain/types';
import {
  DeferredJobHandlerRegistry,
  TenantScopeRunner,
  waitContextsReady,
} from '@inn/core/deferred-jobs/application';
import { flotaContexts } from '@inn/operaciones/turnos-vehiculos/application/constants';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { FlotaTareaDiariaService } from '../services/flota-tarea-diaria.service';
import { VencimientoProgramacionService } from '../services/vencimiento-programacion.service';

const STARTUP_DELAY_MS = 5_000;
const MIN_GAP_NON_PERIODIC_MS = 60_000;

type OrigenReconciliacion = 'arranque' | 'backend-listo' | 'periodica';

@Injectable()
export class FlotaVencimientoReconciliacionJob implements OnApplicationBootstrap {
  private readonly logger = new Logger(FlotaVencimientoReconciliacionJob.name);
  private running = false;
  private polling = false;
  private lastRunAt = 0;

  constructor(
    private readonly runner: TenantScopeRunner,
    private readonly registry: DeferredJobHandlerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    this.registry.onBackendReady(() => void this.ejecutar('backend-listo'));
    setTimeout(() => void this.ejecutar('arranque'), STARTUP_DELAY_MS).unref();
  }

  @Cron('*/15 * * * *', { timeZone: 'America/Bogota' })
  async reconciliacionPeriodica(): Promise<void> {
    await this.ejecutar('periodica');
  }

  @Cron('0 * * * *', { timeZone: 'America/Bogota' })
  async pollDebidos(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      await this.esperarConexiones();
      for (const context of flotaContexts()) {
        try {
          const n = await this.runner.run(context, VencimientoProgramacionService, s =>
            s.procesarVencidosProgramados(),
          );
          if (n) this.logger.log(`Jobs debidos [${context.getCode()}]: ${n}`);
        } catch (error) {
          this.logger.error(
            `Poll de jobs [${context.getCode()}] falló: ${(error as Error).message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Poll de jobs no arrancó: ${(error as Error).message}`);
    } finally {
      this.polling = false;
    }
  }

  async ejecutar(origen: OrigenReconciliacion): Promise<void> {
    if (this.running) return;
    if (origen !== 'periodica' && Date.now() - this.lastRunAt < MIN_GAP_NON_PERIODIC_MS) return;
    this.running = true;
    let ok = true;
    try {
      await this.esperarConexiones();
      for (const context of flotaContexts()) {
        try {
          const result = await this.runner.run(context, VencimientoProgramacionService, s =>
            s.recuperarTenant(),
          );
          this.logger.log(
            `Reconciliación (${origen}) [${context.getCode()}]: +${result.scheduled} -${result.cancelled} =${result.unchanged}`,
          );
          if (origen !== 'periodica') {
            await this.runner.run(context, FlotaTareaDiariaService, s => s.ejecutar());
          }
        } catch (error) {
          ok = false;
          this.logger.error(
            `Reconciliación (${origen}) [${context.getCode()}] falló: ${(error as Error).message}`,
          );
        }
      }
      if (ok) this.lastRunAt = Date.now();
    } catch (error) {
      this.logger.error(
        `Reconciliación (${origen}) no arrancó: ${(error as Error).message}`,
      );
    } finally {
      this.running = false;
    }
  }

  private esperarConexiones(): Promise<void> {
    return waitContextsReady([GCM_CONTEXTS.EKLIPSE, ...flotaContexts()]);
  }
}
