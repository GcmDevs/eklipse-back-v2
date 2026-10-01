import { ResourceNotFoundError } from "@common/domain/errors";
import { FindThrowOptions } from "@common/domain/types";
import { TypeOrmResponsableRepository } from "@core/terceros/infrastructure/persistence";
import { Injectable } from "@nestjs/common";
import { ResponsableView } from "@orm/cor";


@Injectable()
export class ResponsableService {
    constructor(private readonly responsableRepository: TypeOrmResponsableRepository) { }

    public async findById(
        id: number,
        options: FindThrowOptions = new FindThrowOptions()
    ): Promise<ResponsableView | null> {
        const responsableFound = await this.responsableRepository.findById(id);
        if (!responsableFound && options.throwIfNotFound) {
            throw new ResourceNotFoundError(`Responsable con id: ${id} no encontrado`);
        }

        return responsableFound
    }

    public async findAll(
        search?: string,
        limit?: number
    ): Promise<ResponsableView[]> {
        const responsablesFound = await this.responsableRepository.findAll(limit, search);
        return responsablesFound
    }
}
