import { UsuariosCreativos } from "@common/domain/enums";
import {
    EstadoActividad,
    EstadoCronograma,
    EstadoPlanActividad,
    ModalidadEjecucionActividad,
    ModoFormato,
    MotivoAnulacionActividad,
    MotivoAsignacionActividad,
    MotivoEjecucionExternaExcepcional,
    MotivoFinalizacionAsignacionActividad,
    MotivoReprogramacionActividad,
    NaturalezaIntervencionActividad,
    OrigenActividad,
    OrigenInicializacionPlan,
    PrioridadActividad,
    TipoActividad,
    TipoEjecutorExterno,
    TipoMantenimiento
} from "@equipos/domain/enums";
import { EstadoVersionFormato, RegistroDiligenciadoFmtRead } from "apps/motor-formatos/domain";
import { EquipoMinimalRead } from "./equipo.read";


export interface VersionFormatoRead {
    id: number;
    etiqueta: string | null;
    version: number | null;
    estado: EstadoVersionFormato;
    fechaPublicacion: Date | null;
    creadoPorId: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export interface FormatoRead {
    id: number;
    nombre: string;
    tipo: TipoMantenimiento;
    modo: ModoFormato,
    codigo: string;
    slug: string;
    descripcion?: string;
    formatoOrigenId?: number | null;
    activo: boolean;
    creadoPor: UsuariosCreativos;
    creadoPorId: number;
    versiones: VersionFormatoRead[];
}


export interface PlanActividadRead {
    id: number;
    equipoId?: number;
    formato: FormatoRead;
    estado: EstadoPlanActividad;
    periocidad: any;
    seRealizaPorExterno: boolean;
    diasAnticipacionNotificacion: number;
    fechaUltimaEjecucion: Date;
    fechaProximaEjecucion: Date;
    origenInicializacion: OrigenInicializacionPlan,
    fechaInicializacion: Date,
    observaciones?: string;
}


export interface ReprogramacionMantenimientoRead {
    id: number;
    planActividadId: number;
    equipoId: number;
    registroActividadId: number;
    fechaProgramaOriginal: Date;
    fechaReprogramada: Date;
    motivo: MotivoReprogramacionActividad;
    motivoDetalle?: string;
    activa: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface RecursoRead {
    nombre: string;
    activo: boolean;
}

export interface RecursoAsignacionTecnicoRead {
    id: number,
    recursoId: number,
    usuarioId: number,
    usuario: any,
    fechaInicio: Date,
    fechaFin: Date,
    activa: boolean,
    motivoAsignacion: string | null,
    motivoAsignacionDetalle: string | null,
    motivoFinalizacion: string | null,
    motivoFinalizacionDetalle: string | null,
    asignadoPorId: number,
    finalizadoPorId?: number,
    observaciones?: string,
    createdAt: Date,
}

export interface AsignacionRecursoActividadRead {
    id: number;
    actividadId: number;
    recursoId: number;
    activa: boolean;
    fechaAsignacion: Date;
    fechaFinalizacion: Date | null;
    asignadoPorId: number;
    finalizadoPorId: number | null;
    motivoAsignacion: MotivoAsignacionActividad | null;
    motivoAsignacionDetalle: string | null;
    motivoFinalizacion: MotivoFinalizacionAsignacionActividad | null;
    motivoFinalizacionDetalle: string | null;
    observaciones: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface EjecucionExternaRead {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    tipoEjecutor: TipoEjecutorExterno;
    nombreTecnico: string;
    terceroTecnicoId: number | null;
    terceroTecnico?: any | null;
    empresaTerceroId: number | null;
    empresaTercero?: any | null;
    empresaNombre: string | null;
    observaciones: string | null;
    esExcepcional: boolean;
    motivoExcepcional: MotivoEjecucionExternaExcepcional | null;
    motivoExcepcionalDetalle: string | null;

    fechaEjecucion: Date;

    anexos: any[];
}

export interface RegistroActividadRead {
    id: number;
    codigo: string;
    equipoId: number;
    equipo: EquipoMinimalRead;

    formatoId: number;
    formato: FormatoRead | null;

    planActividadId: number | null;
    planActividad: PlanActividadRead | null;
    recursoId: number | null;
    recurso: RecursoRead | null;
    registroDilgId: number | null;
    ejecucionExterna: EjecucionExternaRead | null;

    tipo: TipoActividad;
    origen: OrigenActividad;
    naturaleza: NaturalezaIntervencionActividad;
    estado: EstadoActividad;
    prioridad: PrioridadActividad;

    fechaProgramada: Date | null;
    fechaRealizacion: Date | null;
    fechaInicio: Date | null;
    fechaFinalizacion: Date | null;
    duracionMinutos: number | null;
    diasDesviacion: number | null;

    modalidadPlanificada: ModalidadEjecucionActividad | null;
    modalidadEjecutada: ModalidadEjecucionActividad | null;

    observaciones: string | null;

    tecnicoResponsableId: number | null;
    solicitadoPorId: number | null;

    aprobadoPorId: number | null;
    fechaAprobacion: Date | null;
    motivoRechazo: string | null;

    costoManoObra: number;
    costoRepuestos: number;
    costoTotal: number;

    reprogramaciones: ReprogramacionMantenimientoRead[];
    asignacionRecurso: AsignacionRecursoActividadRead | null;
    motivoAnulacion: MotivoAnulacionActividad;
    anexos: any[]
    createdAt: Date;
    updatedAt: Date;
}

export interface CronogramaRead {
    id: number;
    anio: number;
    mes: number;
    tipo: TipoActividad;
    estado: EstadoCronograma;
    metaCumplimientoPct: number;
    creadoPorId: number;
    notas: string | null;
    createdAt: Date;
    updatedAt: Date;
}