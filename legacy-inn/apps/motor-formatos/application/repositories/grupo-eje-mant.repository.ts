import { GrupoEjecucionMantOrm } from "apps/motor-formatos/infrastructure";
import { GrupoEjecucionMantRead } from "../read";

export interface GrupoEjecucionMantRepository {
    save(grupoEjecucion: Partial<GrupoEjecucionMantOrm>): Promise<GrupoEjecucionMantRead>;
    findByIds(ids: number[]): Promise<GrupoEjecucionMantOrm[]>;
    findAll(): Promise<GrupoEjecucionMantRead[]>;
}