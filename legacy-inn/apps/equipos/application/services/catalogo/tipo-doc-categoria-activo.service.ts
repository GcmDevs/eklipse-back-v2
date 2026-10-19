import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import { TipoDocCategoriaActivoRepository } from '@equipos/domain/repositories/catalogo/tipo-doc-categoria-activo.repository';
import { TIPO_DOC_CATEGORIA_ACTIVO_REPOSITORY } from '@equipos/domain/repositories/tokens';
import { TipoDocCategoriaActivo } from '@equipos/domain/entities/catalogo/tipo-doc-categoria-activo.entity';
import { ReglasObligatoriedadTipoActivo } from '@equipos/domain/value-objects';
import { TipoDocCategoriaActivoRead } from '@equipos/domain/read';
import {
  CreateTipoDocCategoriaActivoDto,
  FilterTipoDocCategoriaActivoDto,
  ReglaObligatoriedadTipoActivoDto,
  ReplaceTipoDocCategoriaActivoDto,
} from '@equipos/presentation/dto';
import { TipoActivoService } from './tipo-activo.service';

@Injectable()
export class TipoDocCategoriaActivoService {
  constructor(
    @Inject(TIPO_DOC_CATEGORIA_ACTIVO_REPOSITORY)
    private readonly repository: TipoDocCategoriaActivoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly tipoActivoService: TipoActivoService
  ) {}

  async create({
    nombre,
    categoria,
    reglasTipoActivo,
    descripcion,
  }: CreateTipoDocCategoriaActivoDto): Promise<TipoDocCategoriaActivoRead> {
    await this.assertTiposActivoExist(reglasTipoActivo);
    const entity = TipoDocCategoriaActivo.create(
      nombre,
      categoria,
      ReglasObligatoriedadTipoActivo.create(reglasTipoActivo),
      descripcion
    );
    return this.txManager.transactional(async () => {
      const saved = await this.repository.save(entity);
      return this.repository.findViewById(saved.getId.getValor);
    });
  }

  async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<TipoDocCategoriaActivo | null> {
    const tipoDocFound = await this.repository.findById(id);
    if (!tipoDocFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`TipoDocCategoriaActivo con id: ${id} no encontrado`);
    }
    return tipoDocFound;
  }

  async findAll({
    tipoActivoId,
    categoria,
    search,
    limit,
  }: FilterTipoDocCategoriaActivoDto): Promise<TipoDocCategoriaActivoRead[]> {
    return this.repository.findAll({ tipoActivoId, categoria, search, limit });
  }

  async replace(
    id: number,
    data: ReplaceTipoDocCategoriaActivoDto
  ): Promise<TipoDocCategoriaActivoRead> {
    await this.assertTiposActivoExist(data.reglasTipoActivo);
    return this.txManager.transactional(async () => {
      const tipoDocCategoria = await this.findById(id);
      tipoDocCategoria!.replaceState(
        data.nombre,
        data.categoria,
        ReglasObligatoriedadTipoActivo.create(data.reglasTipoActivo),
        data.descripcion
      );
      await this.repository.update(tipoDocCategoria!);
      return this.repository.findViewById(id);
    });
  }

  private async assertTiposActivoExist(reglas: ReglaObligatoriedadTipoActivoDto[]): Promise<void> {
    const throwOpts = new FindThrowOptions();
    throwOpts.throwIfNotFound = true;
    await Promise.all(
      reglas.map(regla => this.tipoActivoService.findById(regla.tipoActivoId, throwOpts))
    );
  }
}
