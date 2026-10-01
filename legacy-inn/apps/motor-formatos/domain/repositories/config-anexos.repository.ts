import { SeccionAnexoImagenes } from "../entities";

export interface SeccionesAnexosRepository {
    findByIdImg(id: number): Promise<SeccionAnexoImagenes | null>;
    findAllImg(): Promise<SeccionAnexoImagenes[]>;
}
