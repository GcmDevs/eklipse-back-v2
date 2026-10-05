import { Inject, Injectable } from '@nestjs/common';
import { PaisOrm } from '@orm/shared-bd';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { PAIS_REPOSITORY, PaisRepository } from '../repositories';

@Injectable()
export class PaisService {
  constructor(
    @Inject(PAIS_REPOSITORY)
    private readonly paisRepository: PaisRepository
  ) {}

  async getAll(search?: string, limit?: number): Promise<PaisOrm[]> {
    return this.paisRepository.findAll(limit, search);
  }

  public async findOneById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<PaisOrm | null> {
    const paisFound = await this.paisRepository.findById(id);
    if (!paisFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Pais con id: ${id} no encontrado`);
    }
    return paisFound;
  }
}
