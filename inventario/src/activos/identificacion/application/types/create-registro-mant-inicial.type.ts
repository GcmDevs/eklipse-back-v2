import { TipoActividad } from "@inn/activos/identificacion/domain/enums";

export class CreateRegistroActividadDefaultType {
    equipoId: number;
    tipo: TipoActividad;
    formatoId?: number;
    planActividadId: number;
    fechaPrograma: Date;
    esRealizaPorExterno: boolean;
}