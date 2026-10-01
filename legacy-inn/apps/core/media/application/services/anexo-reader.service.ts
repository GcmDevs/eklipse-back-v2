import { EntidadTipoAnexo } from '@common/domain/enums';
import { ANEXO_REPOSITORY, AnexoRepository } from '@core/media/domain/repositories';
import { makeAnexoGroupKey, WithAnexos } from '@core/media/domain/types';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AnexoReader {
    constructor(
        @Inject(ANEXO_REPOSITORY)
        private readonly repo: AnexoRepository,
    ) { }


    async enrich<T extends WithAnexos>(
        items: T[],
        entidadTipo: EntidadTipoAnexo,
    ): Promise<void> {
        if (!items?.length || items.some(i => !i?.id)) return;
        const lookupItems = items.map((i) => ({
            entidadTipo,
            entidadId: i.id,
        }));

        const grouped = await this.repo.findGroupedByEntidad(lookupItems);
        for (const item of items) {
            const key = makeAnexoGroupKey(entidadTipo, item.id);
            item.anexos = grouped.get(key) ?? [];
        }
    }

    async enrichOne<T extends WithAnexos>(
        item: T,
        entidadTipo: EntidadTipoAnexo,
    ): Promise<void> {
        await this.enrich([item], entidadTipo);
    }
}