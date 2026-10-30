import { ResourceNotFoundError } from '@common/domain/errors';
import { UnidadMedida } from '@inn/activos/identificacion/domain/entities';
import { UNIDAD_MEDIDA_REPOSITORY } from '@inn/activos/identificacion/domain/repositories';
import { UnidadMedidaRepository } from '@inn/activos/identificacion/domain/repositories/catalogo';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class UnidadMedidaService {
  constructor(
    @Inject(UNIDAD_MEDIDA_REPOSITORY)
    private readonly unidadMedidaRepository: UnidadMedidaRepository
  ) {}

  public async getAll(): Promise<UnidadMedida[]> {
    return await this.unidadMedidaRepository.findAll();
  }

  public async findOneById(id: number): Promise<UnidadMedida> {
    const unidadMedidaFound = await this.unidadMedidaRepository.findById(id);
    if (!unidadMedidaFound)
      throw new ResourceNotFoundError(`unidad de medida con id ${id} no encontrada`);
    return unidadMedidaFound;
  }
}
