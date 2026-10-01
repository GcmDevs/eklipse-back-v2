export interface RecordatorioResponse {
    recordatorios: Recordatorio[];
}

export interface Recordatorio {
    FECHOR_INICIAL_CITA: Date;
    FECHOR_FINAL_CITA: Date;
    ESTADO_CITA: number;
    TIPO_IDENTIFICACION: string;
    NUM_IDENTIFICACION: string;
    NOMBRE_PACIENTE: string;
    COD_ESPECIALIDAD: string;
    NOM_ESPECIALIDAD: string;
    ID_MEDICO: number;
    NOM_MEDICO: string;
}