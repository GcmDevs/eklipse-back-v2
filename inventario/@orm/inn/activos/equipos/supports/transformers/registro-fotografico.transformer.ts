import { RegistroFotografico } from "@inn/activos/identificacion/domain/value-objects";
import { ValueTransformer } from "typeorm";

export const registroFotograficoTransformer: ValueTransformer = {
    to: (value?: RegistroFotografico | null): string | null => {
        if (!value || value.isEmpty()) return null;
        return JSON.stringify(value.toPrimitives());
    },
    from: (value?: string | null): RegistroFotografico => {
        try {
            return RegistroFotografico.fromPrimitives(
                value ? JSON.parse(value) : []
            );
        } catch {
            return RegistroFotografico.create();
        }
    },
};