import { EstadoItemDotacion, RespuestaEntregaItem } from '../enums';

export interface EntregaItemJson {
  key: string;
  respuesta: RespuestaEntregaItem | string;
  observacion?: string | null;
  evidencias?: number[];
}

export interface EntregaDatosJson {
  items: EntregaItemJson[];
}

export interface LimpiezaItemJson {
  key: string;
  respuesta: 'C' | 'NC' | null;
  observacion?: string | null;
  evidencias?: number[];
}

export interface LimpiezaDatosJson {
  items: LimpiezaItemJson[];
}

export interface DotacionItemJson {
  key: string;
  estado: EstadoItemDotacion | string;
  cantidadEncontrada?: number | null;
  fechaVencObservada?: string | null;
  fechaVencRegistrada?: string | null;
  observacion?: string | null;
}

export interface DotacionDatosJson {
  items: DotacionItemJson[];
}
