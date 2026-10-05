import { Inject, Injectable } from '@nestjs/common';
import {
  CreateEjecucionMantItemDto,
  CreateGrupoEjecucionMantDto,
} from 'apps/motor-formatos/presentation/dto';
import {
  EJECUCION_MANT_ITEM_REPOSITORY,
  EjecucionMantItemRepository,
  GRUPO_EJE_MANT_REPOSITORY,
  GrupoEjecucionMantRepository,
} from '../repositories';
import { EjecucionMantItemRead, GrupoEjecucionMantRead } from '../read';
import { EjecucionMantItemOrm, GrupoEjecucionMantOrm } from 'apps/motor-formatos/infrastructure';

@Injectable()
export class EjecucionMantService {
  constructor(
    @Inject(EJECUCION_MANT_ITEM_REPOSITORY)
    private readonly ejecucionMantRepository: EjecucionMantItemRepository,
    @Inject(GRUPO_EJE_MANT_REPOSITORY)
    private readonly grupoEjecucionMantRepository: GrupoEjecucionMantRepository
  ) {}

  public async createGrpEjecucion({
    nombre,
  }: CreateGrupoEjecucionMantDto): Promise<GrupoEjecucionMantRead> {
    const grupoEjecucion = { nombre };
    const grupoEjecucionSaved = await this.grupoEjecucionMantRepository.save(grupoEjecucion);
    return grupoEjecucionSaved;
  }

  public async createEjecucionItem(
    createEjecucionMantItemData: CreateEjecucionMantItemDto
  ): Promise<EjecucionMantItemRead> {
    const ejecucionItem = {
      texto: createEjecucionMantItemData.texto,
      tipoRespuesta: createEjecucionMantItemData.tipoRespuesta,
      adicional: createEjecucionMantItemData.adicional,
      textoAyuda: createEjecucionMantItemData.textoAyuda,
    };
    const ejecucionItemSaved = await this.ejecucionMantRepository.save(ejecucionItem);
    return ejecucionItemSaved;
  }

  public async findEjecucionesItemsByIds(ids: number[]): Promise<EjecucionMantItemOrm[]> {
    if (!ids || ids.length === 0) return [];
    const ejecucionItems = await this.ejecucionMantRepository.findByIds(ids);
    return ejecucionItems;
  }

  public async findGrpsEjecucionByIds(ids: number[]): Promise<GrupoEjecucionMantOrm[]> {
    if (!ids || ids.length === 0) return [];
    const gruposEjecuciones = await this.grupoEjecucionMantRepository.findByIds(ids);
    return gruposEjecuciones;
  }

  public async getAllGrpsEjecucion(): Promise<GrupoEjecucionMantRead[]> {
    return await this.grupoEjecucionMantRepository.findAll();
  }

  public async getAllEjecucionesItems(): Promise<EjecucionMantItemRead[]> {
    return await this.ejecucionMantRepository.findAll();
  }
}
