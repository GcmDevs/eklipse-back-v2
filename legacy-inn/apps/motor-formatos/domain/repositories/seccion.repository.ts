import { SeccionPlantillaFmt } from "../entities";
import { SeccionPlantillaFmtRead } from "../read";

export interface SeccionPlantillaRepository {
    save(seccion: SeccionPlantillaFmt): Promise<SeccionPlantillaFmtRead>;
    findViewById(id: number): Promise<SeccionPlantillaFmtRead | null>;
    findByIds(ids: number[]): Promise<SeccionPlantillaFmt[]>;
    findAllView(): Promise<SeccionPlantillaFmtRead[]>;
}
