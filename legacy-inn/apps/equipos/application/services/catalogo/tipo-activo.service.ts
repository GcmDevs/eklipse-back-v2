import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import { TipoActivoRepository } from '@equipos/domain/repositories';
import { TipoActivo } from '@equipos/domain/entities';
import { TipoActivoRead } from '@equipos/domain/read';
import { CreateTipoActivoDto, FilterTipoActivoDto, UpdateTipoActivoDto } from '@equipos/presentation/dto';
import { TIPO_ACTIVO_REPOSITORY } from '@equipos/domain/repositories';

@Injectable()
export class TipoActivoService {
  constructor(
    @Inject(TIPO_ACTIVO_REPOSITORY)
    private readonly repository: TipoActivoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
  ) {}

  async create({ nombre, codigo, descripcion }: CreateTipoActivoDto): Promise<TipoActivoRead> {
    const tipoActivo = TipoActivo.create(nombre, codigo, descripcion);
    return this.txManager.transactional(async () => {
      const saved = await this.repository.save(tipoActivo);
      return this.repository.findViewById(saved.getId.getValor);
    });
  }

  async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions(),
  ): Promise<TipoActivo | null> {
    const tipoActivoFound = await this.repository.findById(id);
    if (!tipoActivoFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`TipoActivo con id: ${id} no encontrado`);
    }
    return tipoActivoFound;
  }

  async findAll({ search, limit }: FilterTipoActivoDto): Promise<TipoActivoRead[]> {
    return this.repository.findAll({ search, limit });
  }

  async update(id: number, data: UpdateTipoActivoDto): Promise<TipoActivoRead> {
    return this.txManager.transactional(async () => {
      const entity = await this.findById(id, { throwIfNotFound: true });
      entity.update(data);
      await this.repository.update(entity);
      return this.repository.findViewById(id);
    });
  }

  async activate(id: number): Promise<void> {
    await this.txManager.transactional(async () => {
      const tipo = await this.findById(id, { throwIfNotFound: true });
      tipo.activate();
      await this.repository.update(tipo);
    });
  }

  async deactivate(id: number): Promise<void> {
    await this.txManager.transactional(async () => {
      const tipo = await this.findById(id, { throwIfNotFound: true });
      tipo.deactivate();
      await this.repository.update(tipo);
    });
  }
}
