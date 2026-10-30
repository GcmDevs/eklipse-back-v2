import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
export const flotaContexts = (): GcmContextType[] => [GCM_CONTEXTS.ALTACENTRO];


export enum TipoAmbulanciaFlota {
  TAM = 'TAM',
  TAB = 'TAB',
}

export enum EstadoServicioAmbulancia {
  EN_SERVICIO = 'EN_SERVICIO',
  FUERA_SERVICIO = 'FUERA_SERVICIO',
}

export enum FormatoPlantilla {
  ENTREGA = 'ENTREGA',
  LIMPIEZA = 'LIMPIEZA',
  DOTACION_TAM = 'DOTACION_TAM',
  DOTACION_TAB = 'DOTACION_TAB',
}

export enum EstadoTurno {
  ACTIVO = 'ACTIVO',
  ENTREGADO = 'ENTREGADO',
  CERRADO = 'CERRADO',
}

export enum OrigenTurno {
  INICIO = 'INICIO',
  RECEPCION = 'RECEPCION',
  RECEPCION_EXCEPCIONAL = 'RECEPCION_EXCEPCIONAL',
}

export enum CausaCierreTurno {
  RECEPCION_INICIADA = 'RECEPCION_INICIADA',
  AUSENCIA_RECEPTOR = 'AUSENCIA_RECEPTOR',
  REEMPLAZADO_EXCEPCIONAL = 'REEMPLAZADO_EXCEPCIONAL',
  SIN_ACTIVIDAD = 'SIN_ACTIVIDAD',
  CIERRE_ADMIN = 'CIERRE_ADMIN',
}

export enum EstadoEntrega {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}

export enum CausaCierreEntrega {
  COMPLETADA = 'COMPLETADA',
  AUSENCIA_RECEPTOR = 'AUSENCIA_RECEPTOR',
  RECEPCION_EXCEPCIONAL = 'RECEPCION_EXCEPCIONAL',
  SIN_ACTIVIDAD = 'SIN_ACTIVIDAD',
  CIERRE_ADMIN = 'CIERRE_ADMIN',
}

export enum RolDeclaracion {
  ENTREGA = 'ENTREGA',
  RECEPCION = 'RECEPCION',
}

export enum EstadoDeclaracion {
  EN_EDICION = 'EN_EDICION',
  CERRADA = 'CERRADA',
}

export enum ModalidadDeclaracion {
  COMPLETO = 'COMPLETO',
  PARCIAL = 'PARCIAL',
  SIN_RESPUESTAS = 'SIN_RESPUESTAS',
}

export enum CausaCierreDeclaracion {
  MANUAL = 'MANUAL',
  VENCIMIENTO = 'VENCIMIENTO',
  CIERRE_PROCESO = 'CIERRE_PROCESO',
}

export enum RespuestaEntregaItem {
  SI = 'SI',
  NO = 'NO',
  NO_APLICA = 'NO_APLICA',
  SIN_REPORTAR = 'SIN_REPORTAR',
}

export enum NoAplicaAcuerdo {
  ACORDADO = 'ACORDADO',
  SIN_ACUERDO = 'SIN_ACUERDO',
}

export enum EstadoLimpieza {
  BORRADOR = 'BORRADOR',
  DILIGENCIADO = 'DILIGENCIADO',
  INCOMPLETO = 'INCOMPLETO',
}

export enum CausaCierreLimpieza {
  MANUAL = 'MANUAL',
  VENCIMIENTO = 'VENCIMIENTO',
  CIERRE_ADMIN = 'CIERRE_ADMIN',
}

export enum EstadoDotacion {
  EN_CURSO = 'EN_CURSO',
  CERRADA = 'CERRADA',
}

export enum EstadoItemDotacion {
  PENDIENTE = 'PENDIENTE',
  CONFORME = 'CONFORME',
  NOVEDAD = 'NOVEDAD',
}

export enum EstadoNovedadDotacion {
  ABIERTA = 'ABIERTA',
  RESUELTA = 'RESUELTA',
  INVALIDADA = 'INVALIDADA',
}

export enum EntidadEventoFlota {
  AMBULANCIA = 'AMBULANCIA',
  TURNO = 'TURNO',
  ENTREGA = 'ENTREGA',
  ENTREGADECL = 'ENTREGADECL',
  LIMPIEZA = 'LIMPIEZA',
  DOTACION = 'DOTACION',
  NOVEDAD = 'NOVEDAD',
}

export enum RecursoPlazoFlota {
  DOTACION = 'DOTACION',
  DECLARACION = 'DECLARACION',
  ENTREGA = 'ENTREGA',
}

/** Tope por defecto al extender un plazo (plan B). */
export const PLAZO_EXTENSION_MAX_MINUTOS = 120;
