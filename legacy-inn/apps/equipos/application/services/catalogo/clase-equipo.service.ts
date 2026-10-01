import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { ClaseEquipo } from '@equipos/domain/entities/catalogo/clase-equipo.entity';
import { SubclaseEquipo } from '@equipos/domain/entities/catalogo/subclase-equipo.entity';
import { ClaseEquipoRead, SubclaseEquipoRead } from '@equipos/domain/read';
import { ClaseEquipoRepository } from '@equipos/domain/repositories/catalogo/clase-equipo.repository';
import { SubclaseEquipoRepository } from '@equipos/domain/repositories/catalogo/subclase-equipo.repository';
import { CLASE_EQUIPO_REPOSITORY, SUBCLASE_EQUIPO_REPOSITORY } from '@equipos/domain/repositories/tokens';
import {
  CreateClaseEquipoDto,
  CreateSubclaseEquipoDto,
  UpdateClaseEquipoDto,
  UpdateSubclaseEquipoDto
} from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClaseEquipoService {
  constructor(
    @Inject(CLASE_EQUIPO_REPOSITORY)
    private readonly claseRepository: ClaseEquipoRepository,
    @Inject(SUBCLASE_EQUIPO_REPOSITORY)
    private readonly subclaseRepository: SubclaseEquipoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
  ) { }

  async createClase({ tipoActivoId, nombre, codigo, descripcion }: CreateClaseEquipoDto): Promise<ClaseEquipoRead> {
    const clase = ClaseEquipo.create(tipoActivoId, nombre, codigo, descripcion);
    return this.txManager.transactional(async () => {
      const saved = await this.claseRepository.save(clase);
      return this.claseRepository.findViewById(saved.getId.getValor);
    });
  }

  async findClaseById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions(),
  ): Promise<ClaseEquipo | null> {
    const claseFound = await this.claseRepository.findById(id);
    if (!claseFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`ClaseEquipo con id: ${id} no encontrado`);
    }
    return claseFound;
  }

  async findAllClases(tipoActivoId: number): Promise<ClaseEquipoRead[]> {
    return this.claseRepository.findAll(tipoActivoId);
  }

  async updateClase(id: number, data: UpdateClaseEquipoDto): Promise<ClaseEquipoRead> {
    return this.txManager.transactional(async () => {
      const entity = await this.findClaseById(id, { throwIfNotFound: true });
      entity.update(data);
      await this.claseRepository.update(entity);
      return this.claseRepository.findViewById(id);
    });
  }

  async desactivarClase(id: number): Promise<void> {
    await this.txManager.transactional(async () => {
      const entity = await this.findClaseById(id, { throwIfNotFound: true });
      entity.desactivar();
      await this.claseRepository.update(entity);
    });
  }

  async createSubclase(
    claseId: number,
    { nombre, codigo, descripcion }: CreateSubclaseEquipoDto,
  ): Promise<SubclaseEquipoRead> {
    await this.findClaseById(claseId, { throwIfNotFound: true });
    const subclase = SubclaseEquipo.create(claseId, nombre, codigo, descripcion);
    return this.txManager.transactional(async () => {
      const saved = await this.subclaseRepository.save(subclase);
      return this.subclaseRepository.findViewById(saved.getId.getValor);
    });
  }

  async findSubclaseById(
    claseId: number,
    subclaseId: number,
    options: FindThrowOptions = new FindThrowOptions(),
  ): Promise<SubclaseEquipo | null> {
    const subclaseFound = await this.subclaseRepository.findById(subclaseId);
    if (!subclaseFound || subclaseFound.getClaseId.getValor !== claseId) {
      if (options.throwIfNotFound) {
        throw new ResourceNotFoundError(
          `SubclaseEquipo con id: ${subclaseId} no encontrada en clase: ${claseId}`,
        );
      }
      return null;
    }
    return subclaseFound;
  }

  async findAllSubclases(claseId: number): Promise<SubclaseEquipoRead[]> {
    await this.findClaseById(claseId, { throwIfNotFound: true });
    return this.subclaseRepository.findAll(claseId);
  }

  async updateSubclase(
    claseId: number,
    subclaseId: number,
    data: UpdateSubclaseEquipoDto,
  ): Promise<SubclaseEquipoRead> {
    return this.txManager.transactional(async () => {
      const entity = await this.findSubclaseById(claseId, subclaseId, { throwIfNotFound: true });
      entity.update(data);
      await this.subclaseRepository.update(entity);
      return this.subclaseRepository.findViewById(subclaseId);
    });
  }

  async desactivarSubclase(claseId: number, subclaseId: number): Promise<void> {
    await this.txManager.transactional(async () => {
      const entity = await this.findSubclaseById(claseId, subclaseId, { throwIfNotFound: true });
      entity.desactivar();
      await this.subclaseRepository.update(entity);
    });
  }

  async resolveTipoActivoIdBySubclaseId(subclaseId: number): Promise<number> {
    const subclase = await this.subclaseRepository.findById(subclaseId);
    if (!subclase) {
      throw new ResourceNotFoundError(`SubclaseEquipo con id: ${subclaseId} no encontrada`);
    }
    const clase = await this.claseRepository.findById(subclase.getClaseId.getValor);
    if (!clase) {
      throw new ResourceNotFoundError(`ClaseEquipo con id: ${subclase.getClaseId.getValor} no encontrada`);
    }
    return clase.getTipoActivoId.getValor;
  }
}
