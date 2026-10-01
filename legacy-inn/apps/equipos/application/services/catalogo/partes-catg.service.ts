import { PaginationConstants } from '@common/application/constants';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { ParteCatg } from '@equipos/domain/entities';
import {
  normalizeParteCatgText,
  PARTE_CATG_SIMILARITY_THRESHOLD,
  parteCatgSimilarity,
} from '@equipos/domain/policies/parte-catg.policies';
import { ParteCatgRead } from '@equipos/domain/read';
import { PARTES_REPOSITORY } from '@equipos/domain/repositories';
import { ParteCatgRepository } from '@equipos/domain/repositories/catalogo';
import { Inject, Injectable } from '@nestjs/common';

export type ResolveParteAccesorioInput = {
    parteId?: number;
    parte?: string;
};

export type ResolvedParteAccesorio = {
    parteId: number;
    parteSnap: string;
};

@Injectable()
export class PartesCatgService {
    constructor(@Inject(PARTES_REPOSITORY)
    private readonly partesCatgRepository: ParteCatgRepository) { }

    async findOrCreate(parteNombre: string): Promise<ParteCatg> {
        const parteSnap = normalizeParteCatgText(parteNombre);
        if (!parteSnap) {
            throw new BadInputError('El nombre de la parte es requerido');
        }

        const exacto = await this.partesCatgRepository.findByParte(parteSnap);
        if (exacto) return exacto;

        const similar = await this.findBestSimilarMatch(parteSnap);
        if (similar) return similar;

        return this.partesCatgRepository.save(ParteCatg.create(parteSnap));
    }

    async resolveForAccesorio({ parteId, parte }: ResolveParteAccesorioInput): Promise<ResolvedParteAccesorio> {
        const nombre = parte?.trim();

        if (nombre) {
            const resolved = await this.findOrCreate(nombre);
            return {
                parteId: resolved.getId.getValor,
                parteSnap: resolved.getParte,
            };
        }

        if (parteId != null && parteId > 0) {
            const catalogo = await this.findById(parteId, new FindThrowOptions());
            return {
                parteId,
                parteSnap: catalogo!.getParte,
            };
        }

        throw new BadInputError('parteId o parte es requerido para el accesorio');
    }

    async findAll(limit?: number, parte?: string): Promise<ParteCatgRead[]> {
        limit = limit ?? PaginationConstants.DEFAULT_PAGE_LIMIT;
        return this.partesCatgRepository.findAllAndCount(limit, parte);
    }

    public async findById(
        id: number,
        options: FindThrowOptions = new FindThrowOptions()
    ): Promise<ParteCatg | null> {
        const parteFound = await this.partesCatgRepository.findById(id);
        if (!parteFound && options.throwIfNotFound) {
            throw new ResourceNotFoundError(`Parte con id: ${id} no encontrado`);
        }
        return parteFound;
    }

    private async findBestSimilarMatch(parteSnap: string): Promise<ParteCatg | null> {
        const candidates = await this.partesCatgRepository.findCandidatesForSimilarity(parteSnap);
        let best: { entity: ParteCatg; score: number } | null = null;

        for (const candidate of candidates) {
            const score = parteCatgSimilarity(parteSnap, candidate.getParte);
            if (score < PARTE_CATG_SIMILARITY_THRESHOLD) continue;
            if (!best || score > best.score) {
                best = { entity: candidate, score };
            }
        }
        return best?.entity ?? null;
    }
}
