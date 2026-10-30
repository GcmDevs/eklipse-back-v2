import { RegistroDiligenciadoFmt } from "../entities";
import { RegistroDiligenciadoFmtRead } from "../read";

export interface RegistroDiligenciadoRepository {
    save(seccion: RegistroDiligenciadoFmt): Promise<RegistroDiligenciadoFmtRead>;
    findById(id: number): Promise<RegistroDiligenciadoFmt | null>;
    findViewById(id: number): Promise<RegistroDiligenciadoFmtRead | null>;
    findByRegActividad(id: number): Promise<RegistroDiligenciadoFmt | null>;
    findViewByRegActividad(id: number): Promise<RegistroDiligenciadoFmtRead | null>;
}
