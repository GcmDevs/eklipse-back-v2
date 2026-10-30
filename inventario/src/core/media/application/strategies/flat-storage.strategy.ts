import { STORAGE_BASE } from "@common/application/constants";
import { ArchivoAlmacenado } from "@inn/core/media/domain/entities";
import { Injectable } from "@nestjs/common";
import * as path from "path";
import { StorageStrategy } from ".";
import { CategoriaArchivo } from "@inn/core/media/domain/enums";

@Injectable()
export class FlatStorageStrategy implements StorageStrategy {
    getDestinationDir({ module }: { category: CategoriaArchivo; module: string }, archivo: ArchivoAlmacenado): string {
        return path.join(STORAGE_BASE, module);
    }

    validateFile(archivo: ArchivoAlmacenado): boolean {
        return true;
    }
}