import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { Modelo } from '@equipos/domain/entities';
import { MODELO_REPOSITORY, ModeloRepository } from '@equipos/domain/repositories';
import { CreateModeloDto } from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import { MarcaService } from './marca.service';
import { ModeloRead } from '@equipos/domain/read';

@Injectable()
export class ModeloService {
  constructor(
    @Inject(MODELO_REPOSITORY) private readonly modeloRepository: ModeloRepository,
    private readonly marcaService: MarcaService
  ) {}

  public async create(modeloData: CreateModeloDto): Promise<ModeloRead> {
    await this.marcaService.findById(modeloData.marcaId);

    const alreadyExist = await this.modeloRepository.existByNombre(modeloData.nombre);
    if (alreadyExist)
      throw new BadInputError(`ya existe un modelo con el nombre ${modeloData.nombre}`);

    const modelo = Modelo.create(modeloData.nombre, modeloData.marcaId);
    const modeloSaved = await this.modeloRepository.save(modelo);
    return await this.modeloRepository.findViewById(modeloSaved.getId.getValor);
  }

  public async getOneById(id: number): Promise<ModeloRead> {
    const modeloFound = await this.modeloRepository.findViewById(id);
    if (!modeloFound) throw new ResourceNotFoundError(`Modelo con id: ${id} no encontrado`);
    return modeloFound;
  }

  public async getAllByMarca(marcaId: number, search?: string): Promise<ModeloRead[]> {
    await this.marcaService.findById(marcaId, { throwIfNotFound: true });
    return await this.modeloRepository.findAllByMarca(marcaId, search);
  }

  public async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<Modelo | null> {
    const modeloFound = await this.modeloRepository.findById(id);
    if (!modeloFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Modelo con id: ${id} no encontrado`);
    }
    return modeloFound;
  }

  public async findModeloByLegacyNombre(
    nombreLegacy: string,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<Modelo | null> {
    const modeloFound = await this.modeloRepository.findModeloByLegacyNombre(nombreLegacy);
    if (!modeloFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Modelo no encontrado`);
    }
    return modeloFound;
  }
}
