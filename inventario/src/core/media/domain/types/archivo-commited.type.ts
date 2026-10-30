import { ArchivoAlmacenado } from "../entities/archivo-almacenado.entity";

export interface ArchivoCommitted {
    archivo: ArchivoAlmacenado;
    destino: string;
    rutaOrigen: string;
}