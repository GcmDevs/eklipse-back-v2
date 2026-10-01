import { AsignacionRecursoActividadRead } from "@equipos/domain/read";
import { AsignacionRecursoActividad } from "../../entities/pool-recursos";

export const ASIGNACION_RECURSO_ACTIVIDAD_REPOSITORY = 'ASIGNACION_RECURSO_ACTIVIDAD_REPOSITORY';

export interface AsignacionRecursoActividadRepository {
    save(asignacion: AsignacionRecursoActividad): Promise<AsignacionRecursoActividad>;
    update(asignacion: AsignacionRecursoActividad): Promise<AsignacionRecursoActividad>;
    findActivaByActividad(actividadId: number): Promise<AsignacionRecursoActividad | null>;
    findAllViewByActividad(actividadId: number): Promise<AsignacionRecursoActividadRead[]>;
    findAllByRecurso(recursoId: number): Promise<AsignacionRecursoActividad[]>;
}