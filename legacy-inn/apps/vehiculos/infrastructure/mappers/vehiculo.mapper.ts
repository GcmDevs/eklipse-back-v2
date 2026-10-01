import { Vehiculo } from '@vehiculos/domain/entities';
import { VehiculoModeloRead, VehiculoRead } from '@vehiculos/domain/reads';
import { VehiculoOrm } from '../persistence/orm/vehiculo.orm';
import { nullIfAbsent } from '@common/presentation/helpers';
import { TipoActivo } from '@vehiculos/domain/enums';

export class AmbulanciaMapper {
  static toDomain(orm: VehiculoOrm): Vehiculo {
    return Vehiculo.rebuild(
      orm.id,
      orm.placa,
      orm.modelo?.id ?? 0,
      orm.estado,
      orm.tipoActivo ?? TipoActivo.VEHICULO,
      orm.tipoCombustible,
      orm.capacidadAlmacenamientoCombustible ?? null,
      orm.unidadMedidaCapacidad,
      orm.kilometrajeActual ?? null,
      orm.anioModelo ?? null,
      orm.clasificacionUso ?? null,
      orm.deleted,
      orm.createdAt,
      orm.updatedAt
    );
  }

  static toView(orm: VehiculoOrm): VehiculoRead {
    return AmbulanciaMapper.normalizeRead({
      id: orm.id,
      placa: orm.placa,
      modeloId: orm.modelo?.id,
      modeloNombre: orm.modelo?.nombre,
      modelo: orm.modelo
        ? {
            id: orm.modelo.id,
            nombre: orm.modelo.nombre,
            marcaId: orm.modelo.marca?.id,
            marcaNombre: orm.modelo.marca?.nombre,
          }
        : undefined,
      estado: orm.estado,
      tipoActivo: orm.tipoActivo ?? TipoActivo.VEHICULO,
      tipoCombustible: orm.tipoCombustible,
      capacidadAlmacenamientoCombustible: orm.capacidadAlmacenamientoCombustible,
      unidadMedidaCapacidad: orm.unidadMedidaCapacidad,
      anioModelo: orm.anioModelo,
      clasificacionUso: orm.clasificacionUso,
      kilometrajeActual: orm.kilometrajeActual,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    })!;
  }

  static toMinimalView(orm: VehiculoOrm): {
    id: number;
    placa: string;
    modelo: string;
    estado: string;
  } {
    return {
      id: orm.id,
      placa: orm.placa,
      modelo: orm.modelo?.nombre ?? '',
      estado: orm.estado,
    };
  }

  static toOrm(domain: Vehiculo): VehiculoOrm {
    const orm = new VehiculoOrm();
    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }
    orm.placa = domain.getPlaca;
    orm.modelo = { id: domain.getModeloId.getValor } as VehiculoOrm['modelo'];
    orm.estado = domain.getEstado;
    orm.tipoActivo = domain.getTipoActivo;
    orm.tipoCombustible = domain.getTipoCombustible;
    orm.capacidadAlmacenamientoCombustible = domain.getCapacidadAlmacenamientoCombustible;
    orm.unidadMedidaCapacidad = domain.getUnidadMedidaCapacidad;
    orm.anioModelo = domain.getAnioModelo;
    orm.clasificacionUso = domain.getClasificacionUso;
    orm.kilometrajeActual = domain.getKilometrajeActual;
    orm.deleted = domain.getDeleted;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toUpdateOrm(domain: Vehiculo): Partial<VehiculoOrm> {
    return {
      id: domain.getId.getValor,
      modelo: { id: domain.getModeloId.getValor } as VehiculoOrm['modelo'],
      estado: domain.getEstado,
      tipoActivo: domain.getTipoActivo,
      tipoCombustible: domain.getTipoCombustible,
      capacidadAlmacenamientoCombustible: domain.getCapacidadAlmacenamientoCombustible,
      unidadMedidaCapacidad: domain.getUnidadMedidaCapacidad,
      anioModelo: domain.getAnioModelo,
      clasificacionUso: domain.getClasificacionUso,
      kilometrajeActual: domain.getKilometrajeActual,
      deleted: domain.getDeleted,
      updatedAt: domain.getUpdatedAt,
    };
  }

  private static normalizeModeloRead(
    value: VehiculoModeloRead | null | undefined
  ): VehiculoModeloRead | null {
    if (!value) return null;
    return {
      id: value.id,
      nombre: value.nombre,
      marcaId: nullIfAbsent(value.marcaId),
      marcaNombre: nullIfAbsent(value.marcaNombre),
    };
  }

  private static normalizeRead(value: VehiculoRead | null | undefined): VehiculoRead | null {
    if (!value) return null;
    return {
      id: value.id,
      placa: value.placa,
      modeloId: nullIfAbsent(value.modeloId),
      modeloNombre: nullIfAbsent(value.modeloNombre),
      modelo: AmbulanciaMapper.normalizeModeloRead(value.modelo),
      estado: value.estado,
      tipoActivo: value.tipoActivo,
      tipoCombustible: value.tipoCombustible,
      capacidadAlmacenamientoCombustible: nullIfAbsent(value.capacidadAlmacenamientoCombustible),
      unidadMedidaCapacidad: value.unidadMedidaCapacidad,
      anioModelo: nullIfAbsent(value.anioModelo),
      clasificacionUso: nullIfAbsent(value.clasificacionUso),
      kilometrajeActual: nullIfAbsent(value.kilometrajeActual),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  }
}
