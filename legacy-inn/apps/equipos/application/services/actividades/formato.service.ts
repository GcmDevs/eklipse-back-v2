import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { Formato } from '@equipos/domain/entities/actividades';
import { TipoMantenimiento } from '@equipos/domain/enums';
import { FormatoRead } from '@equipos/domain/read';
import { FORMATO_REPOSITORY, FormatoRepository } from '@equipos/domain/repositories';
import { FilterFormatoDto } from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import { VersionFormatoFmt } from 'apps/motor-formatos/domain';

@Injectable()
export class FormatoService {
  constructor(@Inject(FORMATO_REPOSITORY) private readonly formatoRepository: FormatoRepository) { }

  public async getOneById(id: number): Promise<FormatoRead> {
    const formatoFound = await this.formatoRepository.findViewById(id);
    if (!formatoFound) throw new ResourceNotFoundError(`Formato con id: ${id} no encontrado`)
    return formatoFound
  }

  public async getAll({ page, limit, search, ...filters}: FilterFormatoDto): Promise<[FormatoRead[], number]> {
    const formatosAndCount = await this.formatoRepository.findAllAndCount(page, limit, search, filters.modo);
    const totalFormatos = formatosAndCount[1];
    if (totalFormatos === 0 && page > 1) {
      throw new BadInputError('No se han encontrado formatos en la página indicada.');
    }
    return formatosAndCount;
  }

  public async findVersionFormato(versionId: number): Promise<VersionFormatoFmt> {
    const version = await this.formatoRepository.findVersionFormato(versionId);
    if (!version) throw new ResourceNotFoundError(`Version de formato no encontrada`);
    return version
  }

  public async findLastVersionFormatoPublished(formatoId: number): Promise<VersionFormatoFmt> {
    const version = await this.formatoRepository.findLastPublishedVersion(formatoId);
    if (!version) throw new ResourceNotFoundError(`el formato con id: ${formatoId} no tiene versiones publicadas`);
    return version;
  }

  public async findByIdAndTipo(
    id: number,
    tipo: TipoMantenimiento,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<Formato | null> {
    const formatoFound = await this.formatoRepository.findByIdAndTipo(id, tipo);
    if (!formatoFound && options.throwIfNotFound)
      throw new ResourceNotFoundError(`Formato con id: ${id} no encontrado`);

    return formatoFound;
  }
}
