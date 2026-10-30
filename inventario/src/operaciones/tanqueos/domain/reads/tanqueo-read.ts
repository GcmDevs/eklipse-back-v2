import {
  AccionEvidenciaLog,
  CanalRegistro,
  EstadoTanqueo,
  ModoValidacionUbicacion,
  OrigenTanqueo,
  ResultadoValidacionUbicacion,
  TipoCombustible,
  TipoEvidencia,
  TipoRegistroTanqueo,
} from '../enums';
import { EstadoEvidencia } from '../enums/estados.enum';
import { EstacionServicioRead } from './estacion-servicio-read';
import { TanqueoInconsistenciaRead } from './tanqueo-inconsistencia-read';
import { VehiculoRead } from './vehiculo-read';

export interface UsuarioRefRead {
  id: number;
  nombreCompleto: string;
}

export interface EvidenciaTanqueoRead {
  tipo: TipoEvidencia;
  estado: EstadoEvidencia;
  mediaId: number | null;
  motivoOmision: string | null;
  fecha: Date;
}

export interface UbicacionCapturaRead {
  latitud: number;
  longitud: number;
  precisionMetros: number | null;
  fechaCaptura: Date | null;
}

export interface ValidacionUbicacionTanqueoRead {
  resultado: ResultadoValidacionUbicacion;
  distanciaMetros: number | null;
  distanciaInicialMetros: number | null;
  radioAplicadoMetros: number | null;
  precisionMetros: number | null;
  latitud: number | null;
  longitud: number | null;
  fechaCaptura: Date | null;
  ubicacionInicial: UbicacionCapturaRead | null;
  motivoNoDisponible: string | null;
  fechaValidacion: Date | null;
}

export interface ConfigUbicacionTanqueoRead {
  modo: ModoValidacionUbicacion;
  radioMetros: number;
}

export class TanqueoRead {
  ctx?: number;
  id: number;
  codigo: string;
  clienteUuid: string;
  activo: VehiculoRead | null;
  origen: OrigenTanqueo;
  repositorioId: number | null;
  repositorioNombre: string | null;
  abastecimientoId: number | null;
  abastecimientoCodigo: string | null;
  usuarioId: number;
  usuarioNombre: string;

  tipoRegistro: TipoRegistroTanqueo;

  canalRegistro: CanalRegistro;

  conductorRealId: number | null;

  kilometraje: number | null;
  kilometrosRecorridos: number | null;
  valorTotalPagado: number | null;
  cantidadCombustible: number | null;
  unidadMedidaCombustible: string | null;
  rendimiento: number | null;
  tipoCombustible: TipoCombustible;
  estacionServicio: EstacionServicioRead | null;
  fechaTanqueo: Date;
  latitud: number | null;
  longitud: number | null;
  precisionMetros: number | null;
  validacionUbicacion: ValidacionUbicacionTanqueoRead | null;
  observaciones: string | null;
  estado: EstadoTanqueo;
  evidencias: EvidenciaTanqueoRead[];
  evidenciasCompletas: boolean;
  creadoOffline: boolean;
  fechaCreacionLocal: Date | null;
  dispositivoId: string | null;
  fechaSincronizacion: Date | null;
  cantidadInconsistencias: number;
  cantidadInconsistenciasActivas: number;
  tieneAlertas: boolean;
  inconsistencias: TanqueoInconsistenciaRead[];
  decididoPorUsuarioId: number | null;
  decididoPorNombre: string | null;
  decididoPor: UsuarioRefRead | null;
  fechaDecision: Date | null;
  motivoDecision: string | null;
  aprobacionConOverride: boolean;

  anuladoPorId: number | null;

  fechaAnulacion: Date | null;

  motivoAnulacion: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface TanqueoCorreccionDetalleRead {
  id: number;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  motivo: string;
  inconsistenciaId: number | null;
  usuarioId: number;
  createdAt: Date;
}

export interface TanqueoHistorialEvidenciaRead {
  id: number;
  tipoEvidencia: TipoEvidencia;
  accion: AccionEvidenciaLog;
  mediaAnteriorId: number | null;
  mediaNuevoId: number | null;
  tipoDestino: string | null;
  motivo: string | null;
  usuarioId: number;
  createdAt: Date;
}

export interface TanqueoDetalleRead extends TanqueoRead {
  correcciones: TanqueoCorreccionDetalleRead[];
  historialEvidencias: TanqueoHistorialEvidenciaRead[];
}
