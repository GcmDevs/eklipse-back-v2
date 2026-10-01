import { TipoRespuestaItem } from "apps/motor-formatos/domain";

export class GrupoEjecucionMantRead {
    id: number;
    nombre: string;
}

export class EjecucionMantItemRead {
    id: number;
    texto: string;
    tipoRespuesta: TipoRespuestaItem;
    adicional?: string;
    textoAyuda: string | null;
}