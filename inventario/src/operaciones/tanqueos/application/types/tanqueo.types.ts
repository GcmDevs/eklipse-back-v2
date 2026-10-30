import {
  CanalRegistro,
  MotivoUbicacionNoDisponible,
  TipoCombustible,
  TipoEvidencia,
  TipoRegistroTanqueo,
  UnidadMedidaCombustible,
} from '@inn/operaciones/tanqueos/domain/enums';
import { TanqueoRead } from '@inn/operaciones/tanqueos/domain/reads';

export interface EvidenciaItem {
  tipo: TipoEvidencia;
  omitida: boolean;
  mediaId: number | null;
  motivoOmision: string | null;
}

export interface UbicacionInicialItem {
  latitud: number;
  longitud: number;
  precisionMetros: number | null;
  fechaCaptura: Date;
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
  fechaCapturaUbicacion?: Date | null;
  ubicacionInicial?: UbicacionInicialItem | null;
  ubicacionNoDisponibleMotivo?: MotivoUbicacionNoDisponible | null;
  gpsSimulado?: boolean | null;
  observaciones: string | null;
  fechaCreacionLocal: Date;
  evidencias: EvidenciaItem[];
  tipoRegistro?: TipoRegistroTanqueo;
  conductorRealOid?: number;
}

export interface SincronizarLote {
  idempotencyKey: string;
  usuarioId: number;
  dispositivoId: string;
  creadoOffline: boolean;
  canalRegistro: CanalRegistro;
  tanqueos: TanqueoItem[];
}

export type ResultadoItemSync =
  | { clienteUuid: string; estado: 'REGISTRADO'; tanqueo: TanqueoRead }
  | { clienteUuid: string; estado: 'DUPLICADO'; codigo: string }
  | { clienteUuid: string; estado: 'RECHAZADO'; motivo: string };
