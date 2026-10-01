import { BadInputError } from "@common/domain/errors";
import { Id } from "@common/domain/value-objects";
import { EstadoSolicitud, TipoAccionAprobacion } from "../enums";

export class SolicitudAprobacion {
    private constructor(
        private readonly id: Id,
        private readonly codigo: string,
        private readonly equipoId: Id,
        private readonly tipoAccion: TipoAccionAprobacion,
        private estado: EstadoSolicitud,
        private readonly solicitanteId: Id,
        private readonly solicitanteNombre: string,
        private aprobadorId: Id | null,
        private aprobadorNombre: string | null,
        private fechaResolucion: Date | null,
        private readonly payload: Record<string, any>,
        private motivoRechazo: string | null,
        private readonly esAutoAprobada: boolean,
        private correlationId: string | null,
        private readonly createdAt: Date,
        private updatedAt: Date
    ) { }


    static create(data: {
        codigo: string;
        equipoId: number;
        tipoAccion: TipoAccionAprobacion;
        solicitanteId: number;
        solicitanteNombre: string;
        correlationId: string | null;
        payload: Record<string, any>;
    }): SolicitudAprobacion {
        return new SolicitudAprobacion(
            new Id(),
            data.codigo,
            new Id(data.equipoId),
            data.tipoAccion,
            EstadoSolicitud.PENDIENTE,
            new Id(data.solicitanteId),
            data.solicitanteNombre,
            null, null, null,
            data.payload,
            null,
            false,
            data.correlationId,
            new Date(), new Date(),
        );
    }

    static createAutoAprobada(data: {
        codigo: string;
        equipoId: number;
        tipoAccion: TipoAccionAprobacion;
        adminId: number;
        adminNombre: string;
        payload: Record<string, any>;
    }): SolicitudAprobacion {
        const now = new Date();
        return new SolicitudAprobacion(
            new Id(),
            data.codigo,
            new Id(data.equipoId),
            data.tipoAccion,
            EstadoSolicitud.APROBADA,
            new Id(data.adminId),
            data.adminNombre,
            new Id(data.adminId),
            data.adminNombre,
            now,
            data.payload,
            null,
            true,
            null,
            now, now,
        );
    }


    static rebuild(
        id: number,
        codigo: string,
        equipoId: number,
        tipoAccion: TipoAccionAprobacion,
        estado: EstadoSolicitud,
        solicitanteId: number,
        solicitanteNombre: string | null,
        aprobadorId: number | null,
        aprobadorNombre: string | null,
        fechaResolucion: Date | null,
        payload: Record<string, any>,
        motivoRechazo: string | null,
        esAutoAprobada: boolean,
        correlationId: string | null,
        createdAt: Date,
        updatedAt: Date,
    ) {
        return new SolicitudAprobacion(
            new Id(id),
            codigo,
            new Id(equipoId),
            tipoAccion,
            estado,
            solicitanteId ? new Id(solicitanteId) : null,
            solicitanteNombre,
            aprobadorId ? new Id(aprobadorId) : null,
            aprobadorNombre,
            fechaResolucion,
            payload,
            motivoRechazo,
            esAutoAprobada,
            correlationId,
            createdAt,
            updatedAt
        )
    }

    approve(aprobadorId: number, aprobadorNombre: string): void {
        if (this.estado !== EstadoSolicitud.PENDIENTE)
            throw new BadInputError('Solo se pueden aprobar solicitudes pendientes');

        this.estado = EstadoSolicitud.APROBADA;
        this.aprobadorId = new Id(aprobadorId);
        this.aprobadorNombre = aprobadorNombre;
        this.fechaResolucion = new Date();
        this.updatedAt = new Date();
    }

    reject(aprobadorId: number, aprobadorNombre: string, motivo: string): void {
        if (this.estado !== EstadoSolicitud.PENDIENTE)
            throw new BadInputError('Solo se pueden rechazar solicitudes pendientes');
        if (!motivo?.trim())
            throw new BadInputError('El motivo de rechazo es obligatorio');

        this.estado = EstadoSolicitud.RECHAZADA;
        this.aprobadorId = new Id(aprobadorId);
        this.aprobadorNombre = aprobadorNombre;
        this.motivoRechazo = motivo.trim();
        this.fechaResolucion = new Date();
        this.updatedAt = new Date();
    }

    esPendiente(): boolean { return this.estado === EstadoSolicitud.PENDIENTE; }
    fueAprobada(): boolean { return this.estado === EstadoSolicitud.APROBADA; }

    get getId(): Id { return this.id; }
    get getCodigo(): string { return this.codigo; }
    get getEquipoId(): Id { return this.equipoId; }
    get getTipoAccion(): TipoAccionAprobacion { return this.tipoAccion; }
    get getEstado(): EstadoSolicitud { return this.estado; }
    get getSolicitanteId(): Id { return this.solicitanteId; }
    get getSolicitanteNombre(): string { return this.solicitanteNombre; }
    get getAprobadorId(): Id | null { return this.aprobadorId; }
    get getAprobadorNombre(): string | null { return this.aprobadorNombre; }
    get getFechaResolucion(): Date | null { return this.fechaResolucion; }
    get getPayload(): Record<string, any> { return this.payload; }
    get getMotivoRechazo(): string | null { return this.motivoRechazo; }
    get getEsAutoAprobada(): boolean { return this.esAutoAprobada; }
    get getCreatedAt(): Date { return this.createdAt; }
    get getUpdatedAt(): Date { return this.updatedAt; }
    get getCorrelationId(): string | null { return this.correlationId }
}