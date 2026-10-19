export enum TipoActivo {
  VEHICULO = 'VEHICULO',
  MAQUINA = 'MAQUINA',
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

export enum CodigoInconsistencia {
  EVI_OMIT_MOT = 'EVI_OMIT_MOT',
  EVI_OMIT = 'EVI_OMIT',
  EVI_NOLEG = 'EVI_NOLEG',
  KM_MENOR_ANT = 'KM_MENOR_ANT',
  KM_SALTO_EXC = 'KM_SALTO',
  CANT_COMB_CAP = 'CANT_COMB_CAP',
  VALOR_ALTO_INU = 'VALOR_ALTO_INU',
  TQ_DUP_SOSPCH = 'TQ_DUP',
}
