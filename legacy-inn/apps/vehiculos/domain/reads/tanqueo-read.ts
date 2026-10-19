import { EstadoTanqueo, OrigenTanqueo, TipoCombustible, TipoEvidencia } from '../enums';
import { EstadoEvidencia } from '../enums/estados.enum';
import { EstacionServicioRead } from './estacion-servicio-read';
import { TanqueoInconsistenciaRead } from './tanqueo-inconsistencia-read';
import { VehiculoRead } from './vehiculo-read';
import { GcmContexts } from '@common/application/constants';

export interface UsuarioRefRead {
  id: number;

  nombreCompleto: string;
}

export interface EvidenciaTanqueoRead {
  tipo: TipoEvidencia;

  estado: EstadoEvidencia;

  mediaId?: number | null;

  motivoOmision?: string | null;

  fecha?: Date;
}

export class TanqueoRead {
  contexto?: GcmContexts;

  contextoNombre?: string;

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

  createdAt: Date;

  updatedAt: Date;
}
