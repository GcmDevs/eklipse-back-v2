import { Injectable, Logger } from '@nestjs/common';
import { In } from 'typeorm';
import { GCM_CONTEXTS, GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services/connections';
import { EkEmpleadoOrm, TrasladoAsignacionOrm, TrasladoAsistencialOrm } from '@hpn/lgc/tas/orm/gcn';
import {
  TrasladoRealtimeEvent,
  TrasladosRealtimeGateway,
} from '../../presentation/gateways/traslados-realtime.gateway';

@Injectable()
export class TrasladosRealtimeDestinatariosService {
  private readonly logger = new Logger(TrasladosRealtimeDestinatariosService.name);

  constructor(private readonly gateway: TrasladosRealtimeGateway) {}

  public async recipients(trasladoId: number, contextoCode: GcmContextCode): Promise<string[]> {
    try {
      const conn = switchConn(gcmContextFactory(contextoCode));
      const traslado = await conn.getRepository(TrasladoAsistencialOrm).findOne({
        where: { id: trasladoId },
        relations: { usuario: true },
        select: { id: true, usuario: { cedula: true } },
      });
      if (!traslado) return [];

      const asignaciones = await conn.getRepository(TrasladoAsignacionOrm).find({
        where: { trasladoId, isActiva: true },
        select: { conductorId: true, auxiliarId: true, medicoId: true },
      });
      const empleadoIds = [
        ...new Set(
          asignaciones
            .flatMap(asignacion => [
              asignacion.conductorId,
              asignacion.auxiliarId,
              asignacion.medicoId,
            ])
            .filter(id => id != null)
        ),
      ];

      // La tripulación se almacena en Eklipse, aunque el traslado pertenezca a otra clínica.
      const empleados = empleadoIds.length
        ? await switchConn(GCM_CONTEXTS.EKLIPSE)
            .getRepository(EkEmpleadoOrm)
            .find({ where: { id: In(empleadoIds) }, select: { documento: true } })
        : [];

      return this.uniqueDocuments([
        traslado.usuario?.cedula,
        ...empleados.map(empleado => empleado.documento),
      ]);
    } catch (error: unknown) {
      this.logger.warn(
        `No se pudieron obtener los destinatarios del traslado ${contextoCode}/${trasladoId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return [];
    }
  }

  public async publish(
    event: Omit<TrasladoRealtimeEvent, 'ocurridoEn'>,
    documentos: string[] = []
  ): Promise<void> {
    try {
      const actuales = await this.recipients(event.trasladoId, event.contextoCode);
      // Incluye a quienes dejan de estar asignados después de una reasignación o cierre.
      this.gateway.publish(event, this.uniqueDocuments([...documentos, ...actuales]));
    } catch (error: unknown) {
      // Una notificación fallida no debe convertir una operación ya confirmada en un error HTTP.
      this.logger.warn(
        `No se pudo publicar la actualización del traslado ${event.contextoCode}/${event.trasladoId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private uniqueDocuments(documentos: string[]): string[] {
    return [...new Set(documentos.map(documento => documento?.trim()).filter(Boolean))];
  }
}
