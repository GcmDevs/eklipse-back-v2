import { CategoriaArchivo } from "../enums/categorias-archivo.enum";

export interface DestinoArchivoConfig {
    category: CategoriaArchivo,
    module: string;
}