import { safeParseJson } from "@common/application/services";
import { EventoAuditEquipoRead, EventoAuditEquipoWorkflowRead, IncidenciaExternaEquipoRead } from "@equipos/domain/read";
import { EventoAuditEquipoOrm } from "@orm/inn/equipos/evento-audit-equipo.orm";
import { IncidenciasExternasEquiposGestserView } from "@orm/inn/equipos";

export class EventoAuditEquipoMapper {
    public static toView(
        orm: EventoAuditEquipoOrm,
    ): EventoAuditEquipoRead {
        return {
            id: orm.id,
            equipoId: orm.equipoId,
            tipo: orm.tipo,
            descripcion: orm.descripcion,
            metadata: safeParseJson(orm.metadata, null),
            actor: {
                id: orm.usuarioId ?? null,
                nombreCompleto: orm.usuarioNombre ?? null,
            },
            secuencia: orm.secuencia ?? null,
            createdAt: orm.createdAt,
        };
    }

    public static toWorkflowView(
        correlationId: string,
        eventos: EventoAuditEquipoOrm[],
    ): EventoAuditEquipoWorkflowRead {
        const ordered = [...eventos].sort((a, b) => {
            const sa = a.secuencia ?? 0;
            const sb = b.secuencia ?? 0;
            if (sa !== sb) return sa - sb;
            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        if (!ordered.length) {
            return {
                correlationId,
                eventos: [],
                latestEventoId: 0,
                lastActivityAt: new Date(0),
                totalEventos: 0,
                rootActivityAt: new Date(0),
            };
        }

        const eventosMapped = ordered.map(this.toView);
        const root = ordered[0];
        const last = ordered.reduce((max, cur) =>
            cur.createdAt > max.createdAt ? cur : max,
            ordered[0],
        );

        return {
            correlationId,
            eventos: eventosMapped,
            latestEventoId: last.id,
            lastActivityAt: last.createdAt,
            totalEventos: eventos.length,
            rootActivityAt: root.createdAt,
        };
    }

    public static toIncidenciaExternaView(
        view: IncidenciasExternasEquiposGestserView,
    ): IncidenciaExternaEquipoRead {
        return {
            solicitudId: view.solicitudId,
            adnCentroAtencion: view.adnCenAte,
            fechaCreacion: view.fechaCreacion,
            ubicacion: view.ubicacion ?? null,
            prioridad: view.prioridad ?? null,
            usuarioSolicita: {
                id: view.usuarioSolicitaId ?? null,
                documento: view.usuarioSolicitaDocumento ?? null,
                nombre: view.usuarioSolicitaNombre ?? null,
            },
            dependencia: {
                id: view.dependenciaId ?? null,
                nombre: view.dependencia ?? null,
            },
            itemId: view.itemId ?? null,
            activoId: view.activoId ?? null,
            placa: view.placa ?? null,
            adnIngreso: view.adnIngreso ?? null,
            observacion: view.observacion ?? null,
            tipoServicioTecnico: view.tipoServicioTecnico ?? null,
            claseServicioTecnico: view.claseServicioTecnico ?? null,
            tipoMantenimiento: view.tipoMantenimiento ?? null,
            tipoTarea: {
                codigo: view.tipoTarea ?? null,
                descripcion: view.tipoTareaDescripcion ?? null,
            },
            estado: {
                codigo: view.estado ?? null,
                descripcion: view.estadoDescripcion ?? null,
            },
        };
    }
}
