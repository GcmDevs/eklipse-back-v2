import { PlantillaEstructuraJson, PlantillaItemEstructura } from '../types';
import { CATEGORIAS_LIMPIEZA, isItemAplicableLimpieza, TipoVehiculoLimpieza } from './declaracion-modalidad.policy';

export interface PlantillaItemFlat {
  key: string;
  texto: string;
  categoria: string;
  categoriaOrden: number;
  orden: number;
  cantidadEsperada?: number;
}

export function flattenPlantillaEstructura(estructura: PlantillaEstructuraJson): PlantillaItemFlat[] {
  const out: PlantillaItemFlat[] = [];
  for (const cat of estructura.categorias ?? []) {
    for (const item of cat.items ?? []) {
      out.push({
        key: item.key,
        texto: item.texto,
        categoria: cat.nombre,
        categoriaOrden: cat.orden,
        orden: item.orden,
        cantidadEsperada: item.cantidadEsperada,
      });
    }
  }
  return out.sort((a, b) => a.categoriaOrden - b.categoriaOrden || a.orden - b.orden);
}

export function getCategoriasLimpiezaPorTipo(
  estructura: PlantillaEstructuraJson,
  tipo: TipoVehiculoLimpieza = 'AMBULANCIA',
) {
  const catKey = CATEGORIAS_LIMPIEZA[tipo];
  return (estructura.categorias ?? []).filter(c => c.key === catKey);
}

export function flattenPlantillaLimpiezaPorTipo(
  estructura: PlantillaEstructuraJson,
  tipo: TipoVehiculoLimpieza = 'AMBULANCIA',
): PlantillaItemFlat[] {
  const catKey = CATEGORIAS_LIMPIEZA[tipo];
  const matchedCats = (estructura.categorias ?? []).filter(c => c.key === catKey);
  const targetCats = matchedCats.length > 0 ? matchedCats : (estructura.categorias ?? []);

  const out: PlantillaItemFlat[] = [];
  for (const cat of targetCats) {
    for (const item of cat.items ?? []) {
      if (isItemAplicableLimpieza(item.key, tipo)) {
        out.push({
          key: item.key,
          texto: item.texto,
          categoria: cat.nombre,
          categoriaOrden: cat.orden,
          orden: item.orden,
          cantidadEsperada: item.cantidadEsperada,
        });
      }
    }
  }
  return out.sort((a, b) => a.categoriaOrden - b.categoriaOrden || a.orden - b.orden);
}

export function seedEntregaItemsFromPlantilla(estructura: PlantillaEstructuraJson) {
  return flattenPlantillaEstructura(estructura).map(i => ({
    key: i.key,
    respuesta: 'SIN_REPORTAR',
    observacion: null,
    evidencias: [] as number[],
  }));
}

export function seedLimpiezaItemsFromPlantilla(
  estructura: PlantillaEstructuraJson,
  tipo: TipoVehiculoLimpieza = 'AMBULANCIA',
) {
  return flattenPlantillaLimpiezaPorTipo(estructura, tipo).map(i => ({
    key: i.key,
    respuesta: null,
    observacion: null,
    evidencias: [] as number[],
  }));
}

export function seedDotacionItemsFromPlantilla(
  estructura: PlantillaEstructuraJson,
  vencByKey: Map<string, string | undefined>,
) {
  return flattenPlantillaEstructura(estructura).map(i => ({
    key: i.key,
    estado: 'PENDIENTE',
    cantidadEncontrada: null,
    fechaVencObservada: null,
    fechaVencRegistrada: vencByKey.get(i.key) ?? null,
    observacion: null,
  }));
}

export function findPlantillaItem(estructura: PlantillaEstructuraJson, key: string): PlantillaItemEstructura | null {
  for (const cat of estructura.categorias ?? []) {
    const found = (cat.items ?? []).find(i => i.key === key);
    if (found) return found;
  }
  return null;
}
