export enum EstadoPlanActividad {
    SIN_CONFIGURAR = 'SIN_CONFIGURAR',
    AL_DIA = 'AL_DIA',
    PROXIMO_A_VENCER = 'PROXIMO_A_VENCER',
    VENCIDO = 'VENCIDO',
    INACTIVO = 'INACTIVO'
}

export enum EstadoSolicitud {
    PENDIENTE = 'PENDIENTE',
    APROBADA = 'APROBADA',
    RECHAZADA = 'RECHAZADA',
    CANCELADA = 'CANCELADA',
    ERROR = 'ERROR'
}

export enum EstadoCronograma {
    ACTIVO = 'ACTIVO',
    CERRADO = 'CERRADO',
    ANULADO = 'ANULADO'
}

export enum EstadoEquipo {
    FUNCIONANDO = 'FUNCIONANDO',
    EN_MANTENIMIENTO = 'MANT',
    EN_BODEGA = 'BODEGA',
    DE_BAJA = 'BAJA'
}

export enum EstadoActividad {
    PROGRAMADO = 'PROGRAMADO',
    PENDIENTE = 'PENDIENTE',
    RETRASADO = 'RETRASADO',
    REPROGRAMADO = 'REPROGRAMADO',
    COMPLETADO = 'COMPLETADO',
    ANULADO = 'ANULADO'
}

export enum EstadoAccesorioUnidad {
    ENTREGADO = 'ENTREGADO',
    PENDIENTE = 'PENDIENTE',
    DANADO = 'DANADO',
    DEPRECIADO = 'DEPRECIADO',
    PERDIDO = 'PERDIDO',
    EN_REPARACION = 'EN_REPARACION',
    OBSOLETO = 'OBSOLETO',
}

export enum EstadoBusquedaEquipo {
    EXISTE = 'EXISTE',
    IMPORTABLE = 'IMPORTABLE',
    NO_EXISTE = 'NO_EXISTE'
}