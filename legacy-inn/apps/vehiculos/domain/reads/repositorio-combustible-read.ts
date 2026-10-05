import {
  EstadoTanqueo,
  TipoCombustible,
  TipoMovimientoCombustible,
  UnidadMedidaCombustible,
} from '../enums';
import { EvidenciaTanqueoRead, UsuarioRefRead } from './tanqueo-read';
import { VehiculoRead } from './vehiculo-read';

export interface RepositorioCombustibleRead {
  id: number;
  nombre: string;
  tipoCombustible: TipoCombustible;
  unidadMedidaCombustible: UnidadMedidaCombustible;
  capacidad: number;
  stockActual: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoTanqueoRefRead {
  id: number;
  codigo: string | null;
  fechaTanqueo: Date;
  estado: EstadoTanqueo;
  cantidadCombustible: number | null;
  kilometraje: number | null;
  evidenciasCompletas: boolean;
  evidencias: EvidenciaTanqueoRead[];
  activo: VehiculoRead | null;
}

export interface MovimientoAbastecimientoRefRead {
  id: number;
  codigo: string;
  valorTotalPagado: number;
  cantidadCombustible: number | null;
  unidadMedidaCombustible: UnidadMedidaCombustible | null;
  tipoCombustible: TipoCombustible;
  fechaAbastecimiento: Date;
  estacionServicioId: number | null;
  estacionServicioNombre: string | null;
  evidenciasCompletas: boolean;
  evidencias: EvidenciaTanqueoRead[];
}

export interface MovimientoCombustibleRead {
  id: number;
  repositorioId: number;
  tipo: TipoMovimientoCombustible;
  cantidad: number;
  stockResultante: number;
  usuario: UsuarioRefRead | null;
  tanqueo: MovimientoTanqueoRefRead | null;
  abastecimiento: MovimientoAbastecimientoRefRead | null;
  createdAt: Date;
}

export interface AbastecimientoRead {
  id: number;
  codigo: string;
  estacionServicioId: number;
  usuarioId: number;
  valorTotalPagado: number;
  cantidadCombustible: number | null;
  unidadMedidaCombustible: UnidadMedidaCombustible | null;
  tipoCombustible: TipoCombustible;
  fechaAbastecimiento: Date;
  tanqueoId: number | null;
  repositorioId: number | null;
  evidenciasCompletas: boolean;
  evidencias: EvidenciaTanqueoRead[];
  createdAt: Date;
  updatedAt: Date;
}
