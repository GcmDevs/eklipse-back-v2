import { ResourceNotFoundError } from '@common/domain/errors';
import { Inject, Injectable } from '@nestjs/common';
import {
  ComponenteSchema,
  KeyPrefix,
  SECCION_ANEXOS_REPOSITORY,
  SECCION_REPOSITORY,
  SeccionAnexoImagenes,
  SeccionesAnexosRepository,
  SeccionPlantillaFmt,
  SeccionPlantillaFmtRead,
  SeccionPlantillaRepository,
  TipoComponente,
} from 'apps/motor-formatos/domain';
import { CreateSeccionPlantillaDto } from 'apps/motor-formatos/presentation/dto';
import { KeyUtils } from '../utils/key.utils';

@Injectable()
export class SeccionesService {
  constructor(
    @Inject(SECCION_REPOSITORY)
    private readonly seccionRepository: SeccionPlantillaRepository,
    @Inject(SECCION_ANEXOS_REPOSITORY)
    private readonly configAnexosRepository: SeccionesAnexosRepository
  ) {}

  public async create(dto: CreateSeccionPlantillaDto): Promise<SeccionPlantillaFmtRead> {
    const componentes: ComponenteSchema[] = dto.componentes.map(comp => ({
      key: KeyUtils.generate(KeyPrefix.txt, comp.etiqueta),
      tipo: TipoComponente.TEXTO_LIBRE,
      orden: comp.orden,
      etiqueta: comp.etiqueta,
      requerido: comp.requerido,
      maxLength: comp.maxLength,
    }));

    const seccion = SeccionPlantillaFmt.create({ nombre: dto.nombre, componentes });
    return await this.seccionRepository.save(seccion);
  }

  public async getById(id: number): Promise<SeccionPlantillaFmtRead | null> {
    const seccion = await this.seccionRepository.findViewById(id);
    if (!seccion) throw new ResourceNotFoundError(`Seccion con id: ${id} no encontrada`);
    return seccion;
  }

  public async findByIds(ids: number[]): Promise<SeccionPlantillaFmt[]> {
    if (!ids?.length) return [];
    return await this.seccionRepository.findByIds(ids);
  }

  public async getAll(): Promise<SeccionPlantillaFmtRead[]> {
    return await this.seccionRepository.findAllView();
  }

  public async findSeccionAnexImagenesById(id: number): Promise<SeccionAnexoImagenes | null> {
    return await this.configAnexosRepository.findByIdImg(id);
  }

  public async getAllSeccionAnexImagenes(): Promise<SeccionAnexoImagenes[]> {
    return await this.configAnexosRepository.findAllImg();
  }
}
