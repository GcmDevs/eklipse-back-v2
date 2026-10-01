import { BadInputError, ResourceNotFoundError } from "@common/domain/errors";
import { FindThrowOptions } from "@common/domain/types";
import { Inject, Injectable } from "@nestjs/common";
import { RolTercero, TerceroOrm } from "@orm/cor";
import { PaisService } from "./pais.service";
import { TERCERO_REPOSITORY, TerceroRepository } from "../repositories";
import { CreateTerceroDto } from "@core/terceros/presentation/dto";

@Injectable()
export class TerceroService {
    constructor(
        @Inject(TERCERO_REPOSITORY)
        private readonly terceroRepository: TerceroRepository,
        private readonly paisService: PaisService,
    ) { }
    
    public async create({
        paisId,
        roles,
        ...data
    }: CreateTerceroDto): Promise<TerceroOrm> {
        if (!roles?.length) {
            throw new BadInputError(    
                'Debe especificar al menos un rol'
            );
        }
        let pais = null;
        if (paisId) {
            pais = await this.paisService.findOneById(paisId);
        }
        return this.terceroRepository.save({
            ...data,
            pais,
            roles: roles.map((rol) => ({ rol })),
        });
    }

    public async getAll(
        search?: string,
        rol?: RolTercero,
        limit?: number,
    ): Promise<TerceroOrm[]> {

        return this.terceroRepository.findAll(
            limit,
            search,
            rol,
        );
    }

    public async findById(
        id: number,
        options: FindThrowOptions = new FindThrowOptions(),
    ): Promise<TerceroOrm | null> {
        const tercero =
            await this.terceroRepository.findById(id);
        if (!tercero) {
            if (options.throwIfNotFound) {
                throw new ResourceNotFoundError(
                    `Tercero con id ${id} no encontrado`
                );
            }
            return null;
        }
        return tercero;
    }

    public async findByIdAndRol(
        id: number,
        rol: RolTercero,
        options: FindThrowOptions = new FindThrowOptions(),
    ): Promise<TerceroOrm | null> {
        const tercero =
            await this.terceroRepository.findByIdAndRol(
                id,
                rol,
            );
        if (!tercero) {
            if (options.throwIfNotFound) {
                throw new ResourceNotFoundError(
                    `Tercero con id ${id} no encontrado`
                );
            }
            return null;
        }
        return tercero;
    }
}