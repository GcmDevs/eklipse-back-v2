import { BaseRepository } from '@common/domain/repositories';
import { Tanqueo } from '../entities';
import { EstadoTanqueo, OrigenTanqueo, TipoActivo } from '../enums';
import { ResumenTanqueosRead, TanqueoRead } from '../reads';

export interface TanqueoFilters {
  activoId?: number;
  usuarioId?: number;
  estacionServicioId?: number;
  tipoCombustible?: string;
  estado?: EstadoTanqueo;
  origen?: OrigenTanqueo;
  fechaDesde?: Date;
  fechaHasta?: Date;
  tieneAlertas?: boolean;
  placa?: string;
  tipoActivo?: TipoActivo;
}

export interface TanqueoRepository extends BaseRepository<Tanqueo, TanqueoRead> {
  findViewById(id: number): Promise<TanqueoRead | null>;
  findAllAndCount(
    page: number,
    limit: number,
    filters?: TanqueoFilters
  ): Promise<[TanqueoRead[], number]>;
  findAllSedesAndCount(
    page: number,
    limit: number,
    filters?: TanqueoFilters
  ): Promise<[TanqueoRead[], number]>;
  findUltimoKilometrajePorVehiculo(ambulanciaId: number): Promise<number | null>;
  findUltimoKilometrajeAprobado(activoId: number): Promise<number | null>;
  getPromedioValorPorActivo(activoId: number): Promise<{ promedio: number; muestra: number }>;
  existsDuplicadoSospechoso(params: {
    activoId: number;
    valorPagado: number;
    fechaTanqueo: Date;
    ventanaMinutos: number;
    excludeClienteUuid?: string | null;
  }): Promise<boolean>;
  findByClienteUuid(clienteUuid: string): Promise<TanqueoRead | null>;
  findViewByCodigo(codigo: string): Promise<TanqueoRead | null>;
  getResumen(filters?: TanqueoFilters): Promise<ResumenTanqueosRead>;
  getResumenAllSedes(filters?: TanqueoFilters): Promise<ResumenTanqueosRead>;
  changeEstado(tanqueo: Tanqueo): Promise<void>;
  saveWithInconsistencias(tanqueo: Tanqueo): Promise<Tanqueo>;
  saveMany(tanqueo: Tanqueo[]): Promise<Tanqueo[]>;
}
