import { FirmaOrm, TipoFirmante } from "@orm/cor";

export interface FirmaRepository {
    save(data: Partial<FirmaOrm>): Promise<FirmaOrm>;
    update(id: number, data: Partial<FirmaOrm>): Promise<FirmaOrm>;
    findById(id: number): Promise<FirmaOrm | null>;
    findByFirmante(firmanteId: number, tipoFirmante: TipoFirmante): Promise<FirmaOrm>;
}
