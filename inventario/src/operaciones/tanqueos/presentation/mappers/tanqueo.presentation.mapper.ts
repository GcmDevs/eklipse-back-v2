import { SincronizarLote, TanqueoItem } from '@inn/operaciones/tanqueos/application/types';
import { CanalRegistro } from '@inn/operaciones/tanqueos/domain/enums';
import { TanqueoFilters } from '@inn/operaciones/tanqueos/domain/repositories';
import {
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
      canalRegistro: dto.canalRegistro ?? CanalRegistro.WEB,
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
      fechaCapturaUbicacion: dto.fechaCapturaUbicacion
        ? new Date(dto.fechaCapturaUbicacion)
        : null,
      ubicacionInicial: dto.ubicacionInicial
        ? {
            latitud: dto.ubicacionInicial.latitud,
            longitud: dto.ubicacionInicial.longitud,
            precisionMetros: dto.ubicacionInicial.precisionMetros ?? null,
            fechaCaptura: new Date(dto.ubicacionInicial.fechaCaptura),
          }
        : null,
      ubicacionNoDisponibleMotivo: dto.ubicacionNoDisponibleMotivo ?? null,
      gpsSimulado:
        dto.gpsSimulado === true ? true : dto.gpsSimulado === false ? false : null,
      observaciones: dto.observaciones ?? null,
      fechaCreacionLocal: new Date(dto.fechaCreacionLocal),
      evidencias: dto.evidencias.map(e => ({
        tipo: e.tipo,
        omitida: e.omitida,
        mediaId: e.mediaId ?? null,
        motivoOmision: e.motivoOmision ?? null,
      })),
      tipoRegistro: dto.tipoRegistro,
      conductorRealOid: dto.conductorRealOid,
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
}
