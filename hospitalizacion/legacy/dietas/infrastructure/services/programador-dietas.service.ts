import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services/connections';
import { processEnv } from '@env';
import { ScheduleOrm } from '../orm/schedule.orm';
import { UsuarioOrm } from '../orm/usuario.orm';
import {
  CierreDietaProgramado,
  crearCierreDieta,
  diaBogota,
  siguienteMedianocheBogota,
} from '../utils/horarios-automaticos';
import { SolicitarDietasAutomaticasService } from './solicitar-dietas-automaticas.service';

const CONTEXTOS = [
  GCM_CONTEXTS.ALTACENTRO,
  GCM_CONTEXTS.AGUACHICA,
  GCM_CONTEXTS.SANJUAN,
  GCM_CONTEXTS.VALLEDUPAR,
];

@Injectable()
export class ProgramadorDietasService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ProgramadorDietasService.name);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly cierres = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly esperas = new Map<ReturnType<typeof setTimeout>, (activo: boolean) => void>();
  private readonly colas = new Map<string, Promise<void>>();
  private detenido = false;
  private generacion = 0;

  constructor(private readonly solicitudes: SolicitarDietasAutomaticasService) {}

  onApplicationBootstrap(): void {
    if (!processEnv.CONNECT_WITH_DB) return;
    const inicio = new Date();
    this.renovar(inicio, inicio);
    this.programarMedianoche(inicio);
  }

  onModuleDestroy(): void {
    this.detenido = true;
    for (const timer of this.timers) clearTimeout(timer);
    for (const resolver of this.esperas.values()) resolver(false);
    this.timers.clear();
    this.esperas.clear();
    this.cierres.clear();
  }

  private renovar(now: Date, desde: Date): void {
    const generacion = ++this.generacion;
    for (const timer of this.cierres.values()) {
      clearTimeout(timer);
      this.timers.delete(timer);
    }
    this.cierres.clear();
    for (const context of CONTEXTOS) {
      void this.cargarContexto(context, diaBogota(now), desde, generacion);
    }
  }

  private async cargarContexto(
    context: GcmContextType,
    dia: string,
    desde: Date,
    generacion: number
  ): Promise<void> {
    if (this.detenido || generacion !== this.generacion) return;
    try {
      const conn = switchConn(context);
      if (!conn.isInitialized) {
        this.agendar(() => void this.cargarContexto(context, dia, desde, generacion), 5000);
        return;
      }
      const usuario = await conn.getRepository(UsuarioOrm).findOne({ where: { id: 1 } });
      if (!usuario) {
        this.logger.error(
          `AUTOMATICA ${context.getCode()}: no existe el usuario 1; contexto deshabilitado.`
        );
        return;
      }
      const horarios = await conn.getRepository(ScheduleOrm).find({
        where: { isActive: true },
        order: { id: 'ASC' },
      });
      if (this.detenido || generacion !== this.generacion) return;
      for (const horario of horarios) {
        try {
          const cierre = crearCierreDieta(context, horario, dia);
          // El segundo de margen no convierte un cierre vencido en uno recuperable.
          if (cierre.cierre.getTime() <= desde.getTime()) continue;
          const key = `${context.getCode()}:${cierre.centroId}:${cierre.horarioId}:${cierre.fecha.toISOString()}`;
          const timer = this.agendar(
            () => {
              this.cierres.delete(key);
              this.encolar(cierre);
            },
            Math.max(0, cierre.ejecutarEn.getTime() - Date.now())
          );
          this.cierres.set(key, timer);
        } catch (error) {
          this.logger.error(`AUTOMATICA ${context.getCode()}: ${this.errorMessage(error)}`);
        }
      }
      this.logger.log(`AUTOMATICA ${context.getCode()}: horarios cargados para ${dia}.`);
    } catch (error) {
      this.logger.error(`AUTOMATICA ${context.getCode()}: ${this.errorMessage(error)}`);
      if (!this.detenido && generacion === this.generacion) {
        this.agendar(() => void this.cargarContexto(context, dia, desde, generacion), 30000);
      }
    }
  }

  private encolar(cierre: CierreDietaProgramado): void {
    const key = cierre.context.getCode();
    if (diaBogota(cierre.cierre) !== diaBogota(new Date())) {
      this.logger.warn(`AUTOMATICA ${key}: se omitió un cierre de un día anterior.`);
      return;
    }
    const anterior = this.colas.get(key) ?? Promise.resolve();
    const siguiente = anterior
      .then(async () => {
        if (this.detenido) return;
        await this.solicitudes.ejecutar(switchConn(cierre.context), cierre, {
          activo: () => !this.detenido,
          esperar: ms => this.esperar(ms),
        });
      })
      .catch(error => this.logger.error(`AUTOMATICA ${key}: ${this.errorMessage(error)}`))
      .finally(() => {
        if (this.colas.get(key) === siguiente) this.colas.delete(key);
      });
    this.colas.set(key, siguiente);
  }

  private programarMedianoche(now: Date): void {
    const midnight = siguienteMedianocheBogota(now);
    this.agendar(() => {
      if (this.detenido) return;
      const actual = new Date();
      // Incluye horarios que cierran a las 00:00 durante la renovación diaria.
      // Si el host estuvo suspendido varios días, no recupera jornadas antiguas.
      const desde =
        diaBogota(actual) === diaBogota(midnight) ? new Date(midnight.getTime() - 1) : actual;
      this.renovar(actual, desde);
      this.programarMedianoche(actual);
    }, midnight.getTime() - now.getTime());
  }

  private esperar(ms: number): Promise<boolean> {
    if (this.detenido) return Promise.resolve(false);
    return new Promise(resolve => {
      const timer = this.agendar(() => {
        this.esperas.delete(timer);
        resolve(!this.detenido);
      }, ms);
      this.esperas.set(timer, resolve);
    });
  }

  private agendar(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.detenido) callback();
    }, ms);
    timer.unref();
    this.timers.add(timer);
    return timer;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
