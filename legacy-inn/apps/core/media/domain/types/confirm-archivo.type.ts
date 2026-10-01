import { DestinoArchivoConfig } from "./destino-archivo-config.type";

export interface ConfirmFileOptions extends DestinoArchivoConfig {
    fileId: number;
}