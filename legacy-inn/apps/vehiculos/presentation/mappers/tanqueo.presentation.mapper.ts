import { SincronizarLote, TanqueoItem } from '@vehiculos/application/types';
import { TanqueoFilters, TanqueoInconsistenciaFilters } from '@vehiculos/domain/repositories';
import {
  FilterInconsistenciaDto,
  FilterTanqueoDto,
  SincronizarLoteTanqueosDto,
  TanqueoItemDto,
} from '../dto';

export class TanqueoPresentationMapper {
  static toSincronizarLote(
    dto: SincronizarLoteTanqueosDto,
    usuarioId: number,
    idempotencyKey: string
  ): SincronizarLote {
    return {
      idempotencyKey,
      usuarioId,
      dispositivoId: dto.dispositivoId,
      creadoOffline: dto.creadoOffline,
      tanqueos: dto.tanqueos.map(TanqueoPresentationMapper.toTanqueoItem),
    };
  }

  static toTanqueoItem(dto: TanqueoItemDto): TanqueoItem {
    return {
      clienteUuid: dto.clienteUuid,
      activoId: dto.activoId,
      kilometraje: dto.kilometraje,
      valorTotalPagado: dto.valorTotalPagado,
      cantidadCombustible: dto.cantidadCombustible ?? null,
      unidadMedidaCombustible: dto.unidadMedidaCombustible ?? null,
      tipoCombustible: dto.tipoCombustible ?? null,
      estacionServicioId: dto.estacionServicioId ?? null,
      fechaTanqueo: new Date(dto.fechaTanqueo),
      latitud: dto.latitud ?? null,
      longitud: dto.longitud ?? null,
      precisionMetros: dto.precisionMetros ?? null,
      observaciones: dto.observaciones ?? null,
      fechaCreacionLocal: new Date(dto.fechaCreacionLocal),
      evidencias: dto.evidencias.map(e => ({
        tipo: e.tipo,
        omitida: e.omitida,
        mediaId: e.mediaId ?? null,
        motivoOmision: e.motivoOmision ?? null,
      })),
    };
  }

  static toTanqueoFiltersFromQuery(query: FilterTanqueoDto): TanqueoFilters {
    const { page: _page, limit: _limit, fechaDesde, fechaHasta, ...rest } = query;
    return {
      ...rest,
      fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
    };
  }

  static toInconsistenciaFilters(
    filters: Omit<FilterInconsistenciaDto, 'page' | 'limit'>
  ): TanqueoInconsistenciaFilters {
    return { ...filters };
  }
}
