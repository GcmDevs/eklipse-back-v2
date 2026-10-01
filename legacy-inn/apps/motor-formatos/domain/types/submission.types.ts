import { TipoComponente } from '../enums';

export interface RespuestaItemGrupo {
  valor:        boolean;
  observacion?: string | null;
}

export interface RespuestaGrupoEjecucion {
  tipo:  TipoComponente.GRUPO_EJECUCION;
  items: Record<string, RespuestaItemGrupo>;
}

export interface RespuestaTabla {
  tipo:  TipoComponente.TABLA;
  filas: Record<string, string | number | boolean | null>[];
}

export interface RespuestaRango {
  tipo:  TipoComponente.RANGO;
  valor: number;
}

export interface RespuestaTextoLibre {
  tipo:  TipoComponente.TEXTO_LIBRE;
  valor: string | null;
}

export type RespuestaComponente =
  | RespuestaGrupoEjecucion
  | RespuestaTabla
  | RespuestaRango
  | RespuestaTextoLibre;

export interface SubmissionPayload {
  versionFormatoId:    number;
  equipoId:            number;
  registroActividadId: number;
  respuestas: Record<string, RespuestaComponente>;
  firmas:     Record<string, { usuarioId: number; archivoFirmaId: number }>;
  imagenes:   Record<string, { archivoId: number | null }>;
}