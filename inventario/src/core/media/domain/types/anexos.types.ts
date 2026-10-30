import { EntidadTipoAnexo } from "@common/domain/enums";

export interface WithAnexos {
    id: number;
    anexos: { id: number }[];
}

export type AnexoGroupKey = `${EntidadTipoAnexo}:${number}`;

export function makeAnexoGroupKey(
    tipo: EntidadTipoAnexo,
    id: number,
): AnexoGroupKey {
    return `${tipo}:${id}` as AnexoGroupKey;
}

export interface AnexoLookupItem {
    entidadTipo: EntidadTipoAnexo;
    entidadId: number;
}