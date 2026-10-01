export enum VariableCalibracionCodigo {
    PRESION = 'PRE',
    TEMPERATURA = 'TEM',
    HUMEDAD = 'HUM',
    LONGITUD = 'LON',
    PESO = 'PES',
    POTENCIA = 'POT',
    FLUJO = 'FLU',
    ENERGIA = 'ENE',
    VELOCIDAD = 'VEL',
    TIEMPO = 'TIE',
}

export const VariableCalibracionCodigoForHumans: Record<VariableCalibracionCodigo, string> = {
    [VariableCalibracionCodigo.PRESION]: 'PRESION',
    [VariableCalibracionCodigo.TEMPERATURA]: 'TEMPERATURA',
    [VariableCalibracionCodigo.HUMEDAD]: 'HUMEDAD',
    [VariableCalibracionCodigo.LONGITUD]: 'LONGITUD',
    [VariableCalibracionCodigo.PESO]: 'PESO',
    [VariableCalibracionCodigo.POTENCIA]: 'POTENCIA',
    [VariableCalibracionCodigo.FLUJO]: 'FLUJO',
    [VariableCalibracionCodigo.ENERGIA]: 'ENERGIA',
    [VariableCalibracionCodigo.VELOCIDAD]: 'VELOCIDAD',
    [VariableCalibracionCodigo.TIEMPO]: 'TIEMPO',
};


export const OTROS_PREFIX = 'OTR:';
export const CODIGOS_VALIDOS = new Set(Object.values(VariableCalibracionCodigo));