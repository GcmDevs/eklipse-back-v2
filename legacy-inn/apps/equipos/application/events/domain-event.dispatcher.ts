import { EventDispatcher } from "@common/application/services";
import { TipoEventoAuditEquipo } from "@equipos/domain/enums/tipos-audit-equipo.enum";
import { DomainEquipoEvent } from "@equipos/domain/events";
import { Injectable } from "@nestjs/common";
import { AuditEquipoService } from "../audit/audit-equipo.service";

@Injectable()
export class DomainEquipoEventDispatcher implements EventDispatcher {
    constructor(private readonly eventoService: AuditEquipoService) { }

    async dispatch(events: DomainEquipoEvent[]): Promise<void> {
        if (!events.length) return;

        const correlationId = events.find(event => event.correlationId)?.correlationId ?? null;
        const secuenciaOffset = correlationId
            ? await this.eventoService.findMaxSecuenciaByCorrelationId(correlationId)
            : 0;
        const assignSecuencia = events.length > 1 || !!correlationId;

        for (let index = 0; index < events.length; index++) {
            const event = events[index];
            await this.eventoService.register({
                equipoId: event.equipoId,
                tipo: event.tipo as TipoEventoAuditEquipo,
                descripcion: event.descripcion,
                autor: {
                    id: event.autorId,
                    nombre: event.autorNombre
                },
                metadata: event.metadata as any,
                correlationId: event.correlationId,
                secuencia: assignSecuencia ? secuenciaOffset + index + 1 : null
            });
        }
    }
}