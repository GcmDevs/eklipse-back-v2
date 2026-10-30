import { PlantillaEstructuraJson } from '../types';
import {
  findPlantillaItem,
  flattenPlantillaEstructura,
  seedDotacionItemsFromPlantilla,
  seedEntregaItemsFromPlantilla,
  seedLimpiezaItemsFromPlantilla,
} from './plantilla-merge.policy';

const estructura: PlantillaEstructuraJson = {
  categorias: [
    { key: 'c2', nombre: 'Cat B', orden: 2, items: [{ key: 'b1', texto: 'B1', orden: 1 }] },
    {
      key: 'c1',
      nombre: 'Cat A',
      orden: 1,
      items: [
        { key: 'a2', texto: 'A2', orden: 2, cantidadEsperada: 4 },
        { key: 'a1', texto: 'A1', orden: 1 },
      ],
    },
  ],
};

describe('plantilla-merge.policy', () => {
  it('aplana y ordena por categoría y luego por ítem', () => {
    expect(flattenPlantillaEstructura(estructura).map((i) => i.key)).toEqual(['a1', 'a2', 'b1']);
  });

  it('conserva categoría, orden y cantidadEsperada', () => {
    const a2 = flattenPlantillaEstructura(estructura).find((i) => i.key === 'a2');
    expect(a2).toMatchObject({
      categoria: 'Cat A',
      categoriaOrden: 1,
      orden: 2,
      cantidadEsperada: 4,
    });
  });

  it('seed de entrega siembra todo en SIN_REPORTAR', () => {
    expect(seedEntregaItemsFromPlantilla(estructura)).toEqual([
      { key: 'a1', respuesta: 'SIN_REPORTAR', observacion: null, evidencias: [] },
      { key: 'a2', respuesta: 'SIN_REPORTAR', observacion: null, evidencias: [] },
      { key: 'b1', respuesta: 'SIN_REPORTAR', observacion: null, evidencias: [] },
    ]);
  });

  it('seed de limpieza deja la respuesta en null', () => {
    const items = seedLimpiezaItemsFromPlantilla(estructura);
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.respuesta === null)).toBe(true);
  });

  it('seed de dotación marca PENDIENTE y copia el vencimiento registrado', () => {
    const venc = new Map<string, string | undefined>([['a1', '2027-01-01']]);
    const items = seedDotacionItemsFromPlantilla(estructura, venc);
    expect(items.find((i) => i.key === 'a1')).toMatchObject({
      estado: 'PENDIENTE',
      fechaVencRegistrada: '2027-01-01',
    });
    expect(items.find((i) => i.key === 'a2')).toMatchObject({ fechaVencRegistrada: null });
  });

  it('findPlantillaItem encuentra por key y null si no existe', () => {
    expect(findPlantillaItem(estructura, 'a2')?.texto).toBe('A2');
    expect(findPlantillaItem(estructura, 'zzz')).toBeNull();
  });

  it('estructura vacía no rompe', () => {
    expect(flattenPlantillaEstructura({ categorias: [] })).toEqual([]);
    expect(flattenPlantillaEstructura({} as PlantillaEstructuraJson)).toEqual([]);
  });
});
