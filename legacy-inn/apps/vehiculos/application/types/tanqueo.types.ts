import { TipoCombustible, TipoEvidencia, UnidadMedidaCombustible } from '@vehiculos/domain/enums';
import { TanqueoRead } from '@vehiculos/domain/reads';

export interface EvidenciaItem {
  tipo: TipoEvidencia;
  omitida: boolean;
  mediaId: number | null;
  motivoOmision: string | null;
}

export interface TanqueoItem {
  clienteUuid: string;
  activoId: number;
  kilometraje?: number;
  valorTotalPagado: number;
  cantidadCombustible: number | null;
  unidadMedidaCombustible: UnidadMedidaCombustible | null;
  tipoCombustible?: TipoCombustible | null;
  estacionServicioId: number | null;
  fechaTanqueo: Date;
  latitud: number | null;
  longitud: number | null;
  precisionMetros: number | null;
  observaciones: string | null;
  fechaCreacionLocal: Date;
  evidencias: EvidenciaItem[];
}

export interface SincronizarLote {
  idempotencyKey: string;
  usuarioId: number;
  dispositivoId: string;
  creadoOffline: boolean;
  tanqueos: TanqueoItem[];
}

export type ResultadoItemSync =
  | { clienteUuid: string; estado: 'REGISTRADO'; tanqueo: TanqueoRead }
  | { clienteUuid: string; estado: 'DUPLICADO'; codigo: string }
  | { clienteUuid: string; estado: 'RECHAZADO'; motivo: string };
