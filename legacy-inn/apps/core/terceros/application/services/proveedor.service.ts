import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { TypeOrmProveedorRepository } from '@core/terceros/infrastructure/persistence';
import { Injectable } from '@nestjs/common';
import { ProveedorOrm } from '@orm/gen';

@Injectable()
export class ProveedorService {
  constructor(private readonly proveedorRepository: TypeOrmProveedorRepository) {
   }

  public async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<ProveedorOrm | null> {
    const proveedorFound = await this.proveedorRepository.findById(id);
    if (!proveedorFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Proveedor con id: ${id} no encontrado`);
    }
    return proveedorFound;
  }

  public async findAll(
    search?: string,
    limit?: number
  ): Promise<ProveedorOrm[]> {
    const finalLimit = limit ?? 20;
    return await this.proveedorRepository.findAll(finalLimit, search);
  }
}
