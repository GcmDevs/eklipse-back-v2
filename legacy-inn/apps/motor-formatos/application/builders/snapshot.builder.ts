import { ensureArray } from '@common/application/services';
import { BadInputError } from '@common/domain/errors';
import {
  ComponenteGrupoEjecucionSchema,
  ComponenteRangoSchema,
  ComponenteSchema,
  ComponenteTablaSchema,
  ComponenteTextoLibreSchema,
  EstructuraFormatoSchema,
  ItemGrupoSchema,
  KeyPrefix,
  OrigenSeccion,
  SeccionPlantillaFmt,
  SeccionSchema,
  TipoComponente,
} from 'apps/motor-formatos/domain';
import { EjecucionMantItemOrm, GrupoEjecucionMantOrm } from 'apps/motor-formatos/infrastructure';
import {
  ComponenteGrupoEjecucionDto,
  ComponenteRangoDto,
  ComponenteTablaDto,
  ComponenteTextoLibreDto,
  DesignVersionFormatoDto,
  SeccionDto,
} from 'apps/motor-formatos/presentation/dto';
import { KeyUtils } from '../utils/key.utils';

export class SnapshotBuilder {
  static build(
    dto: DesignVersionFormatoDto,
    catalogoSecciones: SeccionPlantillaFmt[],
    catalogoGrupos: GrupoEjecucionMantOrm[],
    catalogoItems: EjecucionMantItemOrm[]
  ): EstructuraFormatoSchema {
    const grupoMap = new Map(catalogoGrupos.map(g => [g.id, g]));
    const itemMap = new Map(catalogoItems.map(i => [i.id, i]));

    const secciones: SeccionSchema[] = ensureArray(dto.secciones)
      .sort((a, b) => a.orden - b.orden)
      .map(sec => SnapshotBuilder.buildSeccion(sec, grupoMap, itemMap));

    return { secciones };
  }

  private static buildSeccion(
    dto: SeccionDto,
    grupoMap: Map<number, GrupoEjecucionMantOrm>,
    itemMap: Map<number, EjecucionMantItemOrm>
  ): SeccionSchema {
    return {
      key: KeyUtils.preserveOrGenerate(dto.key, KeyPrefix.sec, dto.nombre),
      orden: dto.orden,
      nombre: dto.nombre,
      origen: dto.origen,
      seccionCatalogoId:
        dto.origen === OrigenSeccion.CATALOGO ? (dto.seccionCatalogoId ?? null) : null,
      componentes: ensureArray(dto.componentes)
        .sort((a, b) => a.orden - b.orden)
        .map(comp => SnapshotBuilder.buildComponente(comp, grupoMap, itemMap)),
    };
  }

  private static buildComponente(
    comp: SeccionDto['componentes'][number],
    grupoMap: Map<number, GrupoEjecucionMantOrm>,
    itemMap: Map<number, EjecucionMantItemOrm>
  ): ComponenteSchema {
    switch (comp.tipo) {
      case TipoComponente.GRUPO_EJECUCION:
        return SnapshotBuilder.buildGrupo(comp as ComponenteGrupoEjecucionDto, grupoMap, itemMap);
      case TipoComponente.TABLA:
        return SnapshotBuilder.buildTabla(comp as ComponenteTablaDto);
      case TipoComponente.RANGO:
        return SnapshotBuilder.buildRango(comp as ComponenteRangoDto);
      case TipoComponente.TEXTO_LIBRE:
        return SnapshotBuilder.buildTextoLibre(comp as ComponenteTextoLibreDto);
      default:
        throw new BadInputError(`Tipo de componente no soportado`);
    }
  }

  private static buildGrupo(
    dto: ComponenteGrupoEjecucionDto,
    grupoMap: Map<number, GrupoEjecucionMantOrm>,
    itemMap: Map<number, EjecucionMantItemOrm>
  ): ComponenteGrupoEjecucionSchema {
    const catGrupo = dto.catalogoGrupoId ? grupoMap.get(dto.catalogoGrupoId) : null;
    const nombre = catGrupo?.nombre ?? dto.nombre;

    const items: ItemGrupoSchema[] = ensureArray(dto.items).map(i => {
      const catItem = i.catalogoItemId ? itemMap.get(i.catalogoItemId) : null;
      return {
        key: KeyUtils.preserveOrGenerate(i.key, KeyPrefix.item, i.texto),
        catalogoItemId: i.catalogoItemId ?? null,
        orden: i.orden,
        texto: catItem?.texto ?? i.texto,
        tipoRespuesta: catItem?.tipoRespuesta ?? i.tipoRespuesta,
        textoAyuda: catItem?.textoAyuda ?? i.textoAyuda ?? null,
        adicional: catItem?.adicional ?? i.adicional ?? null,
      };
    });

    return {
      key: KeyUtils.preserveOrGenerate(dto.key, KeyPrefix.grp, nombre),
      tipo: TipoComponente.GRUPO_EJECUCION,
      orden: dto.orden,
      nombre,
      catalogoGrupoId: dto.catalogoGrupoId ?? null,
      items,
    };
  }

  private static buildTabla(dto: ComponenteTablaDto): ComponenteTablaSchema {
    return {
      key: KeyUtils.preserveOrGenerate(dto.key, KeyPrefix.tbl, dto.etiqueta),
      tipo: TipoComponente.TABLA,
      orden: dto.orden,
      etiqueta: dto.etiqueta,
      columnas: ensureArray(dto.columnas).map(col => ({
        key: KeyUtils.preserveOrGenerate(col.key, KeyPrefix.col, col.etiqueta),
        etiqueta: col.etiqueta,
        tipoDato: col.tipoDato,
      })),
      filasEsperadas: dto.filasEsperadas,
      filasEtiquetas: ensureArray(dto.filasEtiquetas),
    };
  }

  private static buildRango(dto: ComponenteRangoDto): ComponenteRangoSchema {
    return {
      key: KeyUtils.preserveOrGenerate(dto.key, KeyPrefix.rng, dto.etiqueta),
      tipo: TipoComponente.RANGO,
      orden: dto.orden,
      etiqueta: dto.etiqueta,
      unidad: dto.unidad,
      min: dto.min,
      max: dto.max,
    };
  }

  private static buildTextoLibre(dto: ComponenteTextoLibreDto): ComponenteTextoLibreSchema {
    return {
      key: KeyUtils.preserveOrGenerate(dto.key, KeyPrefix.txt, dto.etiqueta),
      tipo: TipoComponente.TEXTO_LIBRE,
      orden: dto.orden,
      etiqueta: dto.etiqueta,
      requerido: dto.requerido ?? false,
      maxLength: dto.maxLength,
    };
  }
}
