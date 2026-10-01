import { BaseRepository } from "@common/domain/repositories";
import { UserScopeContext } from "@auth/domain/interfaces/data-scope.interfaces";
import { PlanActividad, RegistroActividad } from "@equipos/domain/entities";
import { EstadoActividad, NaturalezaIntervencionActividad, OrigenActividad, TipoActividad } from "@equipos/domain/enums";
import { RegistroActividadRead } from "@equipos/domain/read";

export interface ResumenEstadoRaw {
    estado: EstadoActividad;
    total: string;
}

export interface RegistroActividadRepository
    extends BaseRepository<RegistroActividad, RegistroActividadRead> {
    save(registro: RegistroActividad): Promise<RegistroActividad>;
    saveMany(registros: RegistroActividad[]): Promise<void>;
    update(registro: RegistroActividad): Promise<RegistroActividad>;
    updatePlan(plan: PlanActividad): Promise<PlanActividad>;
    findById(id: number): Promise<RegistroActividad | null>;
    findViewById(id: number): Promise<RegistroActividadRead | null>;
    findByIdAndTipo(
        id: number,
        tipo: TipoActividad,
    ): Promise<RegistroActividad | null>;
    findProgramadoPendienteByPlan(
        planActividadId: number,
    ): Promise<RegistroActividad | null>;
    findPendientesByEquipoId(
        equipoId: number,
    ): Promise<RegistroActividad[]>;
    findPlanesAplicanCreacionProgramado(): Promise<PlanActividad[]>;
    findAllViewFilter(
        page: number,
        limit: number,
        usuarioCtx: UserScopeContext,
        estado?: EstadoActividad,
        tipo?: TipoActividad,
        naturaleza?: NaturalezaIntervencionActividad,
        equipoId?: number,
        revisado?: boolean,
        fechaInicio?: Date,
        fechaFin?: Date,
    ): Promise<[RegistroActividadRead[], number]>;
    sumaryEstadosByFechas(
        fechaInicio: Date,
        fechaFin: Date,
    ): Promise<ResumenEstadoRaw[]>;

    countByEstadoForCronograma(
        anio: number,
        mes: number,
        tipo: TipoActividad,
    ): Promise<ResumenEstadoRaw[]>;

    findForReporte(filters: {
        fechaInicio?: Date;
        fechaFin?: Date;
        tipo?: TipoActividad;
        estado?: EstadoActividad;
        equipoId?: number;
        origen?: OrigenActividad;
        page: number;
        limit: number;
    }): Promise<[RegistroActividadRead[], number]>;

    markPendientes(): Promise<void>;

    markRetrasados(): Promise<void>;
}
