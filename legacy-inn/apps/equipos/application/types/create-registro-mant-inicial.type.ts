import { TipoActividad } from "@equipos/domain/enums";

export class CreateRegistroActividadDefaultType {
    equipoId: number;
    tipo: TipoActividad;
    formatoId?: number;
    planActividadId: number;
    fechaPrograma: Date;
    esRealizaPorExterno: boolean;
}