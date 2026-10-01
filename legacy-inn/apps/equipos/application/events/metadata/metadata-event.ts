import { EstadoEquipo, OrigenActividad, OrigenCambio, TipoAccionAprobacion, TipoActividad, TipoAuditTipoEquipo } from "@equipos/domain/enums";
import { TipoEventoAuditEquipo } from "@equipos/domain/enums/tipos-audit-equipo.enum";

export interface MetadataCambioEstado {
    estadoAnterior: EstadoEquipo;
    nuevoEstado: EstadoEquipo;
}

export interface MetadataActualizacionEquipo {
    camposModificados: string[];
    valoresAnteriores: Record<string, any>;
    valoresNuevos: Record<string, any>;
}

export interface MetadataMantenimiento {
    registroActividadId: number;
    tipoActividad: TipoActividad;
    origen: OrigenActividad;
    fechaProgramada?: Date;
    fechaRealizacion?: Date;
    tecnicoResponsable?: string;
    costoTotal?: number;
}

export interface MetadataSolicitudAprobacion {
    solicitudId: number;
    tipoAccion: TipoAccionAprobacion;
    solicitanteNombre?: string;
    aprobadorNombre?: string;
    motivoRechazo?: string;
    payload?: Record<string, any>;
}

export interface MetadataBaja {
    estadoAnterior: EstadoEquipo;
    motivo?: string;
}

export interface MetadataEquipoImportado {
    payload: Record<string, any>;
    legacy: {
        generalActivoId: number;
        activoId: number;
        numeroPlaca: string;
    };
}

export interface MetadataSincronizacionTipoEquipo {
    tipoEquipoId?: number;
    origen?: OrigenCambio;
    campo?: string | null;
    valorAnterior?: string | null;
    valorNuevo?: string | null;
    accion?: TipoAuditTipoEquipo;
    accesorioEstandarId?: number;
    parteSnap?: string;
}

export type MetadataEventoMap = {
    [TipoEventoAuditEquipo.CAMBIO_ESTADO]: MetadataCambioEstado;
    [TipoEventoAuditEquipo.EQUIPO_ACTUALIZADO]: MetadataActualizacionEquipo;
    [TipoEventoAuditEquipo.ACTIVIDAD_PROGRAMADA]: MetadataMantenimiento;
    [TipoEventoAuditEquipo.ACTIVIDAD_COMPLETADA]: MetadataMantenimiento;
    [TipoEventoAuditEquipo.ACTIVIDAD_REPROGRAMADA]: MetadataMantenimiento;
    [TipoEventoAuditEquipo.ACTIVIDAD_INMEDIATA]: MetadataMantenimiento;
    [TipoEventoAuditEquipo.BAJA]: MetadataBaja;
    [TipoEventoAuditEquipo.EQUIPO_CREADO]: Record<string, never>;
    [TipoEventoAuditEquipo.EQUIPO_IMPORTADO]: MetadataEquipoImportado;
    [TipoEventoAuditEquipo.ACCION_SOLICITADA]: MetadataSolicitudAprobacion;
    [TipoEventoAuditEquipo.ACCION_APROBADA]: MetadataSolicitudAprobacion;
    [TipoEventoAuditEquipo.ACCION_RECHAZADA]: MetadataSolicitudAprobacion;
    [TipoEventoAuditEquipo.SINCRONIZACION_TIPO_EQUIPO]: MetadataSincronizacionTipoEquipo;
    [TipoEventoAuditEquipo.ACCESORIO_ACTUALIZADO]: MetadataSincronizacionTipoEquipo;
    [TipoEventoAuditEquipo.INCIDENCIA_EXTERNA]: Record<string, never>;
};
