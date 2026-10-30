export enum TipoAdquisicion {
  COMPRA = 'COMPRA',
  COMODATO = 'COMODATO',
  ALQUILER = 'ALQUILER',
  OTROS = 'OTROS',
}

export enum TipoActividad {
  MANTENIMIENTO = 'MANTENIMIENTO',
  CALIBRACION = 'CALIBRACION',
}

export enum NaturalezaIntervencionActividad {
  PREVENTIVA = 'PREVENTIVA',
  CORRECTIVA = 'CORRECTIVA',
  PREDICTIVA = 'PREDICTIVA',
}

export enum ModalidadEjecucionActividad {
  INTERNA = 'INTERNA',
  EXTERNA = 'EXTERNA',
}

export enum TipoAccionAprobacion {
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
  ACTUALIZAR = 'ACTUALIZAR',
  DAR_DE_BAJA = 'DAR_DE_BAJA',
}

export enum TipoManual {
  USUARIO = 'USUARIO',
  SERVICIO = 'SERVICIO',
  FICHA_TECNICA = 'FICHA_TECNICA',
}

export enum CategoriaDocumento {
  ANNEX_CHECK_SUPPORT = 'SOPORTE_ANEXO',
  TRANSACTIONAL_SUPPORT = 'SOPORTE_TRANSACCIONAL',
  MANUAL = 'MANUAL'
}

export enum TipoMantenimiento {
  PREVENTIVO = 'PREVENTIVO',
  CORRECTIVO = 'CORRECTIVO',
  PREDICTIVO = 'PREDICTIVO'
}

export enum TipoEjecutorExterno {
  TECNICO_INDEPENDIENTE = 'TECNICO_INDEPENDIENTE',
  EMPRESA_CON_TECNICO = 'EMPRESA_CON_TECNICO',
}

export enum RolFirmaRegistro {
  TECNICO_EJECUTOR = 'TECNICO_EJECUTOR',
  LIDER_AREA = 'LIDER_AREA',
}
