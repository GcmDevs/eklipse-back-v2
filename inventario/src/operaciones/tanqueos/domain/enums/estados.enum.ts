export enum EstadoTanqueo {
  VALIDADO_AUTOMATICAMENTE = 'VALIDADO_AUTOMATICAMENTE',
  APTO_PARA_REVISION = 'APTO_PARA_REVISION',
  VALIDADO_MANUALMENTE = 'VALIDADO_MANUALMENTE',
  ANULADO = 'ANULADO',
}

export enum EstadoInconsistencia {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}

export enum ResultadoInconsistencia {
  CORREGIDA = 'CORREGIDA',
  JUSTIFICADA = 'JUSTIFICADA',
  FALSO_POSITIVO = 'FALSO_POSITIVO',
}

/** Resultados permitidos en `PATCH /inconsistencias/:id/resolver` (no incluye CORREGIDA). */
export enum ResultadoInconsistenciaResolucion {
  JUSTIFICADA = 'JUSTIFICADA',
  FALSO_POSITIVO = 'FALSO_POSITIVO',
}

export enum EstadoAbastecimiento {
  ACTIVO = 'ACTIVO',
  ANULADO = 'ANULADO',
}

export enum EstadoIntentoTanqueo {
  PENDIENTE = 'PENDIENTE',
  RECUPERADO = 'RECUPERADO',
}

export enum EstadoVehiculo {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
}

export enum EstadoEvidencia {
  CAPTURADA = 'CAPTURADA',
  OMITIDA = 'OMITIDA',
  NO_APLICA = 'NO_APLICA',
}
