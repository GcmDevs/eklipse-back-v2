export interface PlantillaItemEstructura {
  key: string;
  texto: string;
  orden: number;
  cantidadEsperada?: number;
}

export interface PlantillaCategoriaEstructura {
  key: string;
  nombre: string;
  orden: number;
  items: PlantillaItemEstructura[];
}

export interface PlantillaEstructuraJson {
  categorias: PlantillaCategoriaEstructura[];
}
