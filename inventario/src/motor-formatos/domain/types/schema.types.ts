import { OrigenSeccion, TipoComponente, TipoDatoTabla, TipoRespuestaItem } from '../enums';

export interface ItemGrupoSchema {
  key: string;
  catalogoItemId: number | null;
  orden: number;
  texto: string;
  tipoRespuesta: TipoRespuestaItem;
  textoAyuda?: string | null;
  adicional?: string | null;
}

export interface ComponenteGrupoEjecucionSchema {
  key: string;
  tipo: TipoComponente.GRUPO_EJECUCION;
  orden: number;
  nombre: string;
  catalogoGrupoId: number | null;
  items: ItemGrupoSchema[];
}


export interface ColumnaTablaSchema {
  key: string;
  etiqueta: string;
  tipoDato: TipoDatoTabla;
}

export interface ComponenteTablaSchema {
  key: string;
  tipo: TipoComponente.TABLA;
  orden: number;
  etiqueta: string;
  columnas: ColumnaTablaSchema[];
  filasEsperadas: number;
  filasEtiquetas?: string[];
}

export interface ComponenteRangoSchema {
  key: string;
  tipo: TipoComponente.RANGO;
  orden: number;
  etiqueta: string;
  unidad: string;
  min: number;
  max: number;
}

export interface ComponenteTextoLibreSchema {
  key: string;
  tipo: TipoComponente.TEXTO_LIBRE;
  orden: number;
  etiqueta: string;
  requerido: boolean;
  maxLength?: number;
}

export type ComponenteSchema =
  | ComponenteGrupoEjecucionSchema
  | ComponenteTablaSchema
  | ComponenteRangoSchema
  | ComponenteTextoLibreSchema;

export interface SeccionSchema {
  key: string;
  orden: number;
  nombre: string;
  origen: OrigenSeccion;
  seccionCatalogoId: number | null;
  componentes: ComponenteSchema[];
}

export interface EstructuraFormatoSchema {
  secciones: SeccionSchema[];
}