import { generateSlug } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { Formato } from '@equipos/domain/entities';
import { FormatoRepository } from '@equipos/domain/repositories';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  FORMATO_ENGINE_REPOSITORY,
  FORMATO_SCHEMA_QUERY,
  FormatoSchemaQuery,
  OrigenSeccion,
  TipoComponente
} from 'apps/motor-formatos/domain';
import { EjecucionMantItemOrm, GrupoEjecucionMantOrm } from 'apps/motor-formatos/infrastructure';
import { CloneFormatoPlantillaDto, ComponenteGrupoEjecucionDto, DesignVersionFormatoDto } from 'apps/motor-formatos/presentation/dto';
import { SnapshotBuilder } from '../builders';
import { EjecucionMantService } from './ejecuciones-mant.service';
import { SeccionesService } from './seccion.service';
import { getUser } from '@common/infrastructure/services';

@Injectable()
export class FormatoEngineService {
  constructor(
    @Inject(FORMATO_ENGINE_REPOSITORY)
    private readonly formatoRepository: FormatoRepository,
    @Inject(FORMATO_SCHEMA_QUERY)
    private readonly formatoSchemaQuery: FormatoSchemaQuery,
    private readonly seccionesService: SeccionesService,
    private readonly ejecucionMantService: EjecucionMantService,
  ) { }


  public async clone({
    formatoBaseId,
    versionFormatoId,
    formatoDestinoId,
    nombre,
    codigo,
    descripcion,
    etiquetaVersion,
  }: CloneFormatoPlantillaDto): Promise<{
    formatoId: number;
    versionId: number;
  }> {

    const formatoBase =
      await this.formatoRepository.findByIdWithSpecificVersion(
        formatoBaseId,
        versionFormatoId,
      );

    if (!formatoBase) {
      throw new ResourceNotFoundError(
        `Formato con id: ${formatoBaseId} no encontrado`,
      );
    }

    if (formatoBase.getVersiones.length === 0) {
      throw new ConflictException(
        `La versión ${versionFormatoId} no pertenece al formato ${formatoBaseId}`,
      );
    }

    let formatoDestino: Formato | undefined;
    if (formatoDestinoId) {
      if (nombre || codigo || descripcion) {
        throw new BadInputError(
          'No debe enviar nombre, codigo o descripción cuando se usa formato destino',
        );
      }

      formatoDestino =
        await this.formatoRepository.findById(formatoDestinoId);
      if (!formatoDestino) {
        throw new ResourceNotFoundError(
          `Formato destino con id: ${formatoDestinoId} no encontrado`,
        );
      }
    }

    else {
      if (!nombre || !codigo) {
        throw new BadInputError(
          'nombre y codigo son requeridos para clonar a un nuevo formato',
        );
      }
    }

    const slug = formatoDestino
      ? undefined
      : await generateSlug(nombre);

    const clonado = formatoBase.clone(
      nombre,
      codigo,
      slug ?? '',
      getUser().id,
      versionFormatoId,
      etiquetaVersion ?? null,
      descripcion,
      formatoDestino,
    );

    const saved = await this.formatoRepository.save(clonado);
    const ultimaVersion =
      saved.getVersiones[
      saved.getVersiones.length - 1
      ];

    return {
      formatoId: saved.getId.getValor,
      versionId: ultimaVersion.getId.getValor,
    };
  }

  public async designVersion(versionId: number, dto: DesignVersionFormatoDto): Promise<void> {
    this.validateDto(dto);

    const version = await this.formatoRepository.findVersionFormato(versionId);
    if (!version) throw new ResourceNotFoundError('Version no encontrada');
    if (version.isPublicado()) throw new BadInputError('No puedes editar una versión publicada');

    const configImagenes = await this.seccionesService.findSeccionAnexImagenesById(dto.configuracionImagenesId)
    if (dto.configuracionImagenesId && !configImagenes)
      throw new ResourceNotFoundError('Configuracion de imagenes no encontrada');

    const catalogoIds = dto.secciones
      .filter(s => s.origen === OrigenSeccion.CATALOGO && s.seccionCatalogoId)
      .map(s => s.seccionCatalogoId);

    const catalogoSecciones = catalogoIds.length
      ? await this.seccionesService.findByIds(catalogoIds)
      : [];

    const { grupos, items } = await this.loadCatalogoGrupos(dto);

    const schema = SnapshotBuilder.build(dto, catalogoSecciones, grupos, items);

    if (dto.configuracionImagenesId)
      version.assingConfiguracionImagenes(dto.configuracionImagenesId);

    version.buildSchema(schema as unknown as Record<string, unknown>);
    await this.formatoRepository.saveVersionFormato(version);
  }

  public async getSchema(versionFormatoId: number): Promise<unknown> {
    const schema = await this.formatoSchemaQuery.getSchema(versionFormatoId);
    if (!schema) throw new ResourceNotFoundError('Version de formato no encontrada');
    return schema;
  }

  public async publish(versionId: number): Promise<void> {
    const version = await this.formatoRepository.findVersionFormato(versionId);
    if (!version)
      throw new ResourceNotFoundError(`Version ${versionId} no encontrada`);

    const alreadyPublished = await this.formatoRepository.existPublishedByFormato(
      version.getFormatoId.getValor
    );
    if (alreadyPublished)
      throw new ConflictException('Ya existe una versión publicada para este formato');

    const evento = version.publish(getUser().id);
    await this.formatoRepository.saveVersionFormato(version);
    await this.formatoRepository.saveVersionFormatoEventoAud(evento);
  }

  public async unPublish(versionId: number): Promise<void> {
    const version = await this.formatoRepository.findVersionFormato(versionId);
    if (!version)
      throw new ResourceNotFoundError(`Versión ${versionId} no encontrada`);

    const evento = version.unPublish(getUser().id);
    await this.formatoRepository.saveVersionFormato(version);
    await this.formatoRepository.saveVersionFormatoEventoAud(evento);
  }

  private async loadCatalogoGrupos(
    dto: DesignVersionFormatoDto
  ): Promise<{ grupos: GrupoEjecucionMantOrm[]; items: EjecucionMantItemOrm[] }> {

    const todosComponentes = dto.secciones.flatMap(s => s.componentes);
    const gruposDto = todosComponentes.filter(
      (c): c is ComponenteGrupoEjecucionDto =>
        c.tipo === TipoComponente.GRUPO_EJECUCION && !!c.catalogoGrupoId
    );

    if (!gruposDto.length) return { grupos: [], items: [] };

    const grupoIds = gruposDto.map(g => g.catalogoGrupoId);
    const itemIds = gruposDto.flatMap(g =>
      g.items.filter(i => i.catalogoItemId).map(i => i.catalogoItemId)
    );

    const [grupos, items] = await Promise.all([
      this.ejecucionMantService.findGrpsEjecucionByIds(grupoIds),
      itemIds.length ? this.ejecucionMantService.findEjecucionesItemsByIds(itemIds) : Promise.resolve([]),
    ]);

    if (grupos.length !== grupoIds.length)
      throw new BadInputError('Uno o más grupos no existen en el catálogo');

    return { grupos, items };
  }

  private validateDto(dto: DesignVersionFormatoDto): void {
    if (!dto.secciones?.length)
      throw new BadInputError('Debe tener al menos una sección');

    const errores: string[] = [];

    for (const sec of dto.secciones) {
      if (!sec.componentes?.length) {
        errores.push(`Sección "${sec.nombre}" (orden ${sec.orden}) no tiene componentes`);
        continue;
      }

      if (sec.origen === OrigenSeccion.CATALOGO && !sec.seccionCatalogoId) {
        errores.push(`Sección "${sec.nombre}": origen 'catalogo' requiere seccionCatalogoId`);
      }

      for (const comp of sec.componentes) {
        if (!comp.tipo || comp.orden == null) {
          errores.push(`Componente inválido en sección "${sec.nombre}"`);
          continue;
        }
        switch (comp.tipo) {
          case TipoComponente.GRUPO_EJECUCION: {
            const g = comp as ComponenteGrupoEjecucionDto;
            if (!g.items?.length)
              errores.push(`Grupo "${g.nombre}" sin ítems (sección "${sec.nombre}")`);
            break;
          }
          case TipoComponente.TABLA: {
            const t = comp as any;
            if (!t.columnas?.length || !t.filasEsperadas)
              errores.push(`Tabla "${t.etiqueta}" sin columnas o filasEsperadas`);
            break;
          }
          case TipoComponente.RANGO: {
            const r = comp as any;
            if (r.min >= r.max)
              errores.push(`Rango "${r.etiqueta}": min debe ser menor que max`);
            break;
          }
        }
      }
    }

    if (errores.length)
      throw new BadInputError(`DTO inválido:\n${errores.map(e => `  - ${e}`).join('\n')}`);
  }
}