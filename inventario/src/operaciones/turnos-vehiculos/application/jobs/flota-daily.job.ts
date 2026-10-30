import { TenantScopeRunner } from '@inn/core/deferred-jobs/application';
import { flotaContexts } from '@inn/operaciones/turnos-vehiculos/application/constants';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FlotaTareaDiariaService } from '../services/flota-tarea-diaria.service';

/**
 * Disparador de la tarea diaria (23:59 America/Bogota): solo barre vencimientos.
 * Ya no inserta filas de dotación. Provider estático; el trabajo corre por tenant.
 */
@Injectable()
export class FlotaDailyJob {
  private readonly logger = new Logger(FlotaDailyJob.name);

  constructor(private readonly runner: TenantScopeRunner) {}

  @Cron('59 23 * * *', { timeZone: 'America/Bogota' })
  async ejecutar(): Promise<void> {
    this.logger.log('Ejecutando tarea diaria flota');
    for (const context of flotaContexts()) {
      try {
        await this.runner.run(context, FlotaTareaDiariaService, service => service.ejecutar());
      } catch (error) {
        this.logger.error(`Tarea diaria [${context.getCode()}] falló: ${(error as Error).message}`);
      }
    }
  }
}
