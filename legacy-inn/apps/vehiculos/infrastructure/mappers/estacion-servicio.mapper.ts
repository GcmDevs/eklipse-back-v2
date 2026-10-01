import { EstacionServicio } from '@vehiculos/domain/entities';
import { EstacionServicioRead } from '@vehiculos/domain/reads';
import { CoordenadasGPS } from '@vehiculos/domain/value-objects';
import { EstacionServicioOrm } from '../persistence/orm';
import { nullIfAbsent } from '@common/presentation/helpers';
import { MunicipioOrm } from '@orm/shared-bd';

export class EstacionServicioMapper {
  static toDomain(orm: EstacionServicioOrm): EstacionServicio {
    const ubicacion =
      orm.ubicacion?.latitud != null && orm.ubicacion?.longitud != null
        ? CoordenadasGPS.create(
            orm.ubicacion.latitud,
            orm.ubicacion.longitud,
            orm.ubicacion.precisionMetros ?? null
          )
        : null;

    return EstacionServicio.rebuild(
      orm.id,
      orm.nombre,
      orm.direccion,
      orm.observaciones ?? null,
      orm.municipio?.id ?? null,
      ubicacion,
      orm.activa,
      orm.creadaPorUsuarioId ?? null,
      orm.createdAt,
      orm.updatedAt
    );
  }

  static toOrm(domain: EstacionServicio): EstacionServicioOrm {
    const orm = new EstacionServicioOrm();
    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }
    orm.nombre = domain.getNombre;
    orm.direccion = domain.getDireccion;
    orm.observaciones = domain.getObservaciones;
    orm.municipio = { id: domain.getMunicipioId?.getValor } as MunicipioOrm;
    if (domain.getUbicacion) {
      orm.ubicacion = {
        latitud: domain.getUbicacion.getLatitud,
        longitud: domain.getUbicacion.getLongitud,
        precisionMetros: domain.getUbicacion.getPrecisionMetros,
      } as EstacionServicioOrm['ubicacion'];
    }
    orm.activa = domain.getActiva;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toUpdateOrm(domain: EstacionServicio): Partial<EstacionServicioOrm> {
    return {
      id: domain.getId.getValor,
      nombre: domain.getNombre,
      direccion: domain.getDireccion,
      observaciones: domain.getObservaciones,
      activa: domain.getActiva,
      updatedAt: domain.getUpdatedAt,
    };
  }

  static toView(orm: EstacionServicioOrm): EstacionServicioRead {
    return EstacionServicioMapper.normalizeRead({
      id: orm.id,
      nombre: orm.nombre,
      direccion: orm.direccion,
      observaciones: orm.observaciones,
      municipio: orm.municipio?.id
        ? {
            id: orm.municipio.id,
            nombre: orm.municipio.nombre,
            departamentoNombre: orm.municipio.departamento.nombre,
          }
        : null,
      ubicacion: orm.ubicacion,
      activa: orm.activa,
      creadaPorUsuario: orm.creadaPorUsuarioId
        ? { id: orm.creadaPorUsuarioId, contexto: orm.creadaPorContexto ?? null }
        : null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    })!;
  }

  private static normalizeRead(
    value: EstacionServicioRead | null | undefined
  ): EstacionServicioRead | null {
    if (!value) return null;

    const ubicacion = value.ubicacion;
    return {
      id: value.id,
      nombre: value.nombre,
      direccion: value.direccion,
      observaciones: nullIfAbsent(value.observaciones),
      municipio: nullIfAbsent(value.municipio),
      ubicacion: ubicacion
        ? {
            latitud: nullIfAbsent(ubicacion.latitud),
            longitud: nullIfAbsent(ubicacion.longitud),
            precisionMetros: nullIfAbsent(ubicacion.precisionMetros),
          }
        : null,
      activa: value.activa,
      creadaPorUsuario: nullIfAbsent(value.creadaPorUsuario),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  }
}
