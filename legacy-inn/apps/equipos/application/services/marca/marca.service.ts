import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { FilterSearchPaginatedDto } from '@common/presentation/dto';
import { Formato, Marca } from '@equipos/domain/entities';
import { MarcaRead } from '@equipos/domain/read';
import {
  FORMATO_REPOSITORY,
  FormatoRepository,
  MARCA_REPOSITORY,
  MarcaRepository,
} from '@equipos/domain/repositories';
import { CreateMarcaDto } from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class MarcaService {
  constructor(
    @Inject(MARCA_REPOSITORY) private readonly marcaRepository: MarcaRepository,
    @Inject(FORMATO_REPOSITORY) private readonly formatoRepository: FormatoRepository
  ) {}

  public async create(marcaData: CreateMarcaDto): Promise<MarcaRead> {
    const alreadyExist = await this.marcaRepository.existByNombre(marcaData.nombre);
    if (alreadyExist)
      throw new BadInputError(`ya existe una marca con el nombre ${marcaData.nombre}`);
    const marca = Marca.create(marcaData.nombre, marcaData?.descripcion);
    const marcaSaved = await this.marcaRepository.save(marca);
    return await this.marcaRepository.findViewById(marcaSaved.getId.getValor);
  }

  public async getOneById(id: number): Promise<MarcaRead> {
    const marfca = await this.marcaRepository.findViewById(id);
    if (!marfca) throw new ResourceNotFoundError();
    return marfca;
  }

  public async getAll({
    page,
    limit,
    search,
  }: FilterSearchPaginatedDto): Promise<[MarcaRead[], number]> {
    return await this.marcaRepository.findAllAndCount(page, limit, search);
  }

  public async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<Marca | null> {
    const marcaFound = await this.marcaRepository.findById(id);
    if (!marcaFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Marca con id: ${id} no encontrado`);
    }

    return marcaFound;
  }

  public async findMarcaByLegacyNombre(
    nombreLegacy: string,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<Marca | null> {
    const marcaFound = await this.marcaRepository.findMarcaByLegacyNombre(nombreLegacy);
    if (!marcaFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Marca no encontrada`);
    }

    return marcaFound;
  }
}
