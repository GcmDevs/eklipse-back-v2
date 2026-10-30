import { MimeTypes } from '@common/domain/enums';
import { CategoriaArchivo } from '../enums';

export enum PoliticaMimeStaging {
    ANY = 'ANY',
}

export type RestriccionMimeStaging =
    | { tiposMime: readonly MimeTypes[] }
    | { categorias: readonly CategoriaArchivo[] }
    | PoliticaMimeStaging.ANY;

export const RESTRICCIONES_MIME_STAGING = {
    IMAGENES: { categorias: [CategoriaArchivo.IMAGEN] },
    DOCUMENTOS: { categorias: [CategoriaArchivo.DOCUMENTO] },
    ANEXOS: {
        categorias: [CategoriaArchivo.IMAGEN, CategoriaArchivo.DOCUMENTO],
    },
    ANY: PoliticaMimeStaging.ANY,
} as const satisfies Record<string, RestriccionMimeStaging>;
