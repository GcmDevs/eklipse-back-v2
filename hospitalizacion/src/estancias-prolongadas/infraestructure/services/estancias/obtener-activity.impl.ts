import { BaseSource } from '@common/infrastructure/services';
import { DominioAccionesEstados, NivelRiesgo } from '@hpn/estancias-prolongadas/application/enums';
import {
  ActivityFeedQueryDto,
  ActivityFeedSeverity,
} from '@hpn/estancias-prolongadas/presentation/dtos';
import { Injectable } from '@nestjs/common';
import { EstanciasProlongadasOrm } from '@orm/hpn/estancias-prolongadas';

type ActivityEventType =
  | 'estancia_creada'
  | 'estancia_cerrada'
  | 'seguimiento_guardado'
  | 'accion_completada'
  | 'accion_bloqueada'
  | 'escalada_activada'
  | 'caso_critico_detectado';

type ActivityFeedItem = {
  id: number;
  eventType: ActivityEventType;
  severity: ActivityFeedSeverity;
  pacienteNombre: string;
  pacienteDoc: string;
  descripcion: string;
  realizadoPor: string;
  sede: string;
  timestamp: string;
  losActual: number;
  semanaSeguimiento: number;
  requiereAtencion: boolean;
};

type PendingActivityFeedItem = ActivityFeedItem | null;

type ActivityFeedKpis = {
  moderado: number;
  critico: number;
  alto: number;
  cerrado: number;
};

@Injectable()
export class ObtenerActivityFeedImpl extends BaseSource {
  public async obtenerActivityFeed(query: ActivityFeedQueryDto) {
    const limit = query.limit ?? 50;
    const authSedeId = this.getAuthSedeId();

    if (query.sedeId && authSedeId && query.sedeId !== authSedeId) {
      return {
        data: [],
        meta: {
          total: 0,
          returned: 0,
          generadoEn: new Date(),
        },
      };
    }

    const estanciaRp = this.conn.getRepository(EstanciasProlongadasOrm);
    const estancias = await estanciaRp.find({
      relations: ['seguimientos', 'acciones'],
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });
    const kpis = this._contruirKpis(estancias);

    const eventos = estancias.flatMap(estancia => {
      const estanciaEventos: PendingActivityFeedItem[] = [
        this._contruirEvento({
          id: estancia.id,
          eventType: 'estancia_creada',
          estancia,
          fechaEvento: estancia.createdAt,
          descripcion: 'Se creo un nuevo caso de estancia prolongada.',
          realizadoPor: estancia.auditor,
        }),
      ];

      if (estancia.scoreTotal >= 41) {
        estanciaEventos.push(
          this._contruirEvento({
            id: estancia.id * 10 + 1,
            eventType: 'caso_critico_detectado',
            estancia,
            fechaEvento: estancia.createdAt,
            descripcion: 'El puntaje total supera el umbral critico definido para el caso.',
            realizadoPor: estancia.auditor,
          })
        );
      }

      if (!estancia.estado && estancia.fechaCierre) {
        estanciaEventos.push(
          this._contruirEvento({
            id: estancia.id * 10 + 2,
            eventType: 'estancia_cerrada',
            estancia,
            fechaEvento: estancia.fechaCierre,
            descripcion: 'Se cerro el caso de estancia prolongada con egreso registrado.',
            realizadoPor: estancia.auditor,
          })
        );
      }

      (estancia.seguimientos ?? []).forEach(seguimiento => {
        const isEscalada = seguimiento.esCritica || seguimiento.semanaNumero >= 4;
        estanciaEventos.push(
          this._contruirEvento({
            id: seguimiento.id,
            eventType: isEscalada ? 'escalada_activada' : 'seguimiento_guardado',
            estancia,
            fechaEvento: seguimiento.createdAt,
            descripcion: isEscalada
              ? 'Se activo escalada a Gobierno Clinico por seguimiento critico del caso.'
              : `Seguimiento semana ${seguimiento.semanaNumero} registrado.`,
            realizadoPor: seguimiento.creadoPor,
            semanaSeguimiento: seguimiento.semanaNumero,
          })
        );
      });

      (estancia.acciones ?? []).forEach(accion => {
        const estado = accion.estado?.toLowerCase();
        if (estado !== DominioAccionesEstados.COMPLETADO && estado !== 'bloqueado') return;

        estanciaEventos.push(
          this._contruirEvento({
            id: accion.id,
            eventType: estado === 'bloqueado' ? 'accion_bloqueada' : 'accion_completada',
            estancia,
            fechaEvento: accion.updatedAt ?? accion.createdAt,
            descripcion:
              estado === 'bloqueado'
                ? `Accion bloqueada: ${accion.accionEspecifica}`
                : `Accion completada: ${accion.accionEspecifica}`,
            realizadoPor: accion.responsable,
            updatedAt: accion.updatedAt,
          })
        );
      });

      return estanciaEventos.filter(Boolean) as ActivityFeedItem[];
    });

    const filtered = eventos
      .filter(event => !query.severity || event.severity === query.severity)
      .filter(
        event =>
          query.requiereAtencion === undefined || event.requiereAtencion === query.requiereAtencion
      )
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));

    const data = filtered.slice(0, limit);

    return {
      data,
      kpis,
      meta: {
        total: filtered.length,
        returned: data.length,
        generadoEn: new Date(),
      },
    };
  }

  private _contruirKpis(estancias: EstanciasProlongadasOrm[]): ActivityFeedKpis {
    return estancias.reduce(
      (acc, estancia) => {
        const nivelRiesgo = estancia.nivelRiesgo?.toLowerCase();
        const tieneSeguimientoCritico = (estancia.seguimientos ?? []).some(
          seguimiento => seguimiento.esCritica || seguimiento.semanaNumero >= 4
        );
        if (!estancia.estado) acc.cerrado += 1;

        if (nivelRiesgo === NivelRiesgo.MODERADO) acc.moderado += 1;
        if (nivelRiesgo === NivelRiesgo.ALTO) acc.alto += 1;
        if (estancia.scoreTotal >= 41 || estancia.currentLos >= 21 || tieneSeguimientoCritico) {
          acc.critico += 1;
        }

        return acc;
      },
      { moderado: 0, critico: 0, alto: 0, cerrado: 0 }
    );
  }
  private getAuthSedeId(): number {
    const context = this.auth?.context as any;
    if (!context?.getNumericCode) return null;
    return context.getNumericCode();
  }
  private _contruirEvento(params: {
    id: number;
    eventType: ActivityEventType;
    estancia: EstanciasProlongadasOrm;
    fechaEvento: Date;
    descripcion: string;
    realizadoPor: string;
    semanaSeguimiento?: number;
    updatedAt?: Date;
  }): PendingActivityFeedItem {
    if (!isValidDate(params.fechaEvento)) return null;

    const losActual = this.calculateLosAt(
      params.estancia.fechaIngreso,
      params.fechaEvento,
      params.estancia.currentLos
    );
    const severity = this.resolverActivitySeveridad(params.eventType, losActual);

    return {
      id: params.id,
      eventType: params.eventType,
      severity,
      pacienteNombre: params.estancia.nombrePaciente,
      pacienteDoc: params.estancia.documento,
      descripcion: params.descripcion,
      realizadoPor: params.realizadoPor,
      sede: params.estancia.sede,
      timestamp: formatColombiaTimestamp(params.fechaEvento),
      losActual,
      semanaSeguimiento: params.semanaSeguimiento ?? null,
      requiereAtencion: this.resolverRequiereAtencion(
        params.eventType,
        losActual,
        params.fechaEvento,
        params.updatedAt
      ),
    };
  }
  private resolverRequiereAtencion(
    eventType: ActivityEventType,
    losActual: number,
    fechaEvento: Date,
    updatedAt?: Date
  ): boolean {
    if (eventType === 'escalada_activada' || eventType === 'caso_critico_detectado') return true;
    if (losActual >= 21) return true;
    if (eventType !== 'accion_bloqueada') return false;

    const lastChange = updatedAt ?? fechaEvento;
    const hoursWithoutChange = (Date.now() - lastChange.getTime()) / (60 * 60 * 1000);
    return hoursWithoutChange > 48;
  }
  private resolverActivitySeveridad(
    eventType: ActivityEventType,
    losActual: number
  ): ActivityFeedSeverity {
    if (eventType === 'escalada_activada' || eventType === 'caso_critico_detectado') {
      return 'critical';
    }
    if (eventType === 'accion_bloqueada' || losActual > 14) return 'warning';
    if (eventType === 'estancia_cerrada' || eventType === 'accion_completada') return 'success';
    return 'info';
  }
  private calculateLosAt(fechaIngreso: Date, fechaEvento: Date, fallbackLos: number): number {
    if (!isValidDate(fechaIngreso) || !isValidDate(fechaEvento)) {
      return fallbackLos ?? 0;
    }

    const diff = fechaEvento.getTime() - fechaIngreso.getTime();
    return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
  }
}
