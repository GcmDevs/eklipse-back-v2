export enum TipoActivo {
  VEHICULO = 'VEHICULO',
  MAQUINA = 'MAQUINA',
}

export enum EstadoOdometro {
  FUNCIONANDO = 'FUNCIONANDO',
  DANADO = 'DANADO',
}

export enum TipoEventoTanqueoLog {
  LIMPIEZA_INTENTOS = 'LIMPIEZA_INTENTOS',
  CAMBIO_ESTADO_ODOMETRO = 'CAMBIO_ESTADO_ODOMETRO',
  AJUSTE_ODOMETRO = 'AJUSTE_ODOMETRO',
}

export enum ClasificacionUso {
  CARGA = 'CARGA',
  PRESIDENCIA = 'PRESIDENCIA',
  UNIDAD_MOVIL = 'UNIDAD_MOVIL',
  MICROBUS = 'MICROBUS',
  AMBULANCIA = 'AMBULANCIA',
  MOTO = 'MOTO',
  MAQUINA = 'MAQUINA',
  PLANTA = 'PLANTA',
}

export enum SeveridadInconsistencia {
  CRITICA = 'CRITICA',
  ADVERTENCIA = 'ADVERTENCIA',
}

export enum UnidadMedidaCombustible {
  GALONES = 'GAL',
  LITROS = 'L',
}

export enum TipoCombustible {
  G_EXTRA = 'EXTRA',
  G_CORRIENTE = 'CORRIENTE',
  DIESEL = 'DIESEL',
  GAS = 'GAS',
}

export enum TipoEvidencia {
  TABLERO_INICIAL = 'TABLERO_INICIAL',
  SURTIDOR_INICIAL = 'SURTIDOR_INICIAL',
  SURTIDOR_FINAL = 'SURTIDOR_FINAL',
  INDICADOR_COMBUSTIBLE_FINAL = 'INDICADOR_COMBUSTIBLE_FINAL',
  FACTURA = 'FACTURA',
  FOTO_REPO_ANTES = 'FOTO_REPO_ANTES',
  FOTO_REPO_DESPUES = 'FOTO_REPO_DESPUES',
}

export enum OrigenTanqueo {
  ESTACION = 'ESTACION',
  REPOSITORIO = 'REPOSITORIO',
}

export enum TipoMovimientoCombustible {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

export enum ResultadoSync {
  OK = 'OK',
  DUPLICADO = 'DUPLICADO',
  RECHAZADO = 'RECHAZADO',
  ERROR = 'ERROR',
}

export enum TipoRegistroTanqueo {
  CONDUCTOR = 'CONDUCTOR',
  COORDINADOR = 'COORDINADOR',
}

export enum CanalRegistro {
  MOVIL = 'MOVIL',
  WEB = 'WEB',
}

export enum FuenteLecturaOdometro {
  TANQUEO = 'TANQUEO',
  AJUSTE = 'AJUSTE',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

export enum AccionEvidenciaLog {
  AGREGADA = 'AGREGADA',
  REEMPLAZADA = 'REEMPLAZADA',
  ELIMINADA = 'ELIMINADA',
  REASIGNADA = 'REASIGNADA',
  OMITIDA = 'OMITIDA',
}

export enum CodigoInconsistencia {
  EVI_OMIT_MOT = 'EVI_OMIT_MOT',
  EVI_OMIT = 'EVI_OMIT',
  /** @deprecated No se genera. Conservado por filas históricas posibles; DGEMPRES99 no tiene ninguna. */
  EVI_NOLEG = 'EVI_NOLEG',
  KM_MENOR_ANT = 'KM_MENOR_ANT',
  KM_SALTO = 'KM_SALTO',
  CANT_COMB_CAP = 'CANT_COMB_CAP',
  VALOR_ALTO_INU = 'VALOR_ALTO_INU',
  TQ_DUP = 'TQ_DUP',
  UBIC_FUERA_RAD = 'UBIC_FUERA_RAD',
  UBIC_DISCREP = 'UBIC_DISCREP',
  UBIC_NO_CONC = 'UBIC_NO_CONC',
}

export enum ResultadoValidacionUbicacion {
  DENTRO_RADIO = 'DENTRO_RADIO',
  FUERA_RADIO = 'FUERA_RADIO',
  DISCREPANCIA = 'DISCREPANCIA',
  NO_CONCLUYENTE = 'NO_CONCLUYENTE',
  NO_VALIDADO = 'NO_VALIDADO',
}

export enum MotivoUbicacionNoDisponible {
  PERMISO_DENEGADO = 'PERMISO_DENEGADO',
  GPS_DESACTIVADO = 'GPS_DESACTIVADO',
  TIMEOUT = 'TIMEOUT',
  NO_SOPORTADO = 'NO_SOPORTADO',
}

export enum ModoValidacionUbicacion {
  OFF = 'OFF',
  SHADOW = 'SHADOW',
  ACTIVE = 'ACTIVE',
}
