import {
  ClasificacionUso,
  EstadoOdometro,
  EstadoVehiculo,
  TipoActivo,
  TipoCombustible,
  UnidadMedidaCombustible,
} from '../enums';

export interface VehiculoModeloRead {
  id: number;
  nombre: string;
  marcaId: number | null;
  marcaNombre: string | null;
}

export interface VehiculoRead {
  id: number;
  placa: string;
  modeloId: number | null;
  modeloNombre: string | null;
  modelo: VehiculoModeloRead | null;
  estado: EstadoVehiculo;
  tipoActivo: TipoActivo;
  tipoCombustible: TipoCombustible;
  capacidadAlmacenamientoCombustible: number | null;
  unidadMedidaCapacidad: UnidadMedidaCombustible;
  anioModelo: number | null;
  clasificacionUso: ClasificacionUso | null;
  /** @deprecated Usar kilometrajeReferencia (última lectura confiable). */
  kilometrajeActual: number | null;
  kilometrajeReferencia: number | null;
  fechaReferencia: string | null;
  referenciaConfiable: boolean;
  odometroEstado: EstadoOdometro;
  createdAt: Date;
  updatedAt: Date;
}
