import { BadInputError } from '@common/domain/errors';
import { EstacionServicio } from '@inn/operaciones/tanqueos/domain/entities';
import { EstacionServicioRead } from '@inn/operaciones/tanqueos/domain/reads';
import { CoordenadasGPS } from '@inn/operaciones/tanqueos/domain/value-objects';
import { EstacionServicioOrm } from '../persistence/orm';
import { nullIfAbsent } from '@common/domain/helpers';
import { MunicipioOrm } from '@inn/orm/shared-bd';

export class EstacionServicioMapper {
  static toDomain(orm: EstacionServicioOrm): EstacionServicio {
    const ubicacion =
      orm.ubicacion?.latitud != null && orm.ubicacion?.longitud != null
        ? CoordenadasGPS.create(
            Number(orm.ubicacion.latitud),
            Number(orm.ubicacion.longitud),
            orm.ubicacion.precisionMetros != null ? Number(orm.ubicacion.precisionMetros) : null
          )
        : null;

    return EstacionServicio.rebuild(
      orm.id,
      orm.nombre,
      orm.direccion,
      orm.nit ?? null,
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
    orm.nit = domain.getNit ?? undefined;
    orm.observaciones = domain.getObservaciones;
    const municipioId = domain.getMunicipioId?.getValor;
    if (!municipioId) {
      throw new BadInputError('municipioId es obligatorio');
    }
    orm.municipio = { id: municipioId } as MunicipioOrm;
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
    const municipioId = domain.getMunicipioId?.getValor;
    const partial: Partial<EstacionServicioOrm> = {
      id: domain.getId.getValor,
      nombre: domain.getNombre,
      direccion: domain.getDireccion,
      nit: domain.getNit ?? undefined,
      observaciones: domain.getObservaciones,
      activa: domain.getActiva,
      updatedAt: domain.getUpdatedAt,
    };
    if (municipioId) {
      partial.municipio = { id: municipioId } as MunicipioOrm;
    }
    if (domain.getUbicacion) {
      partial.ubicacion = {
        latitud: domain.getUbicacion.getLatitud,
        longitud: domain.getUbicacion.getLongitud,
        precisionMetros: domain.getUbicacion.getPrecisionMetros,
      } as EstacionServicioOrm['ubicacion'];
    }
    return partial;
  }

  static toView(orm: EstacionServicioOrm): EstacionServicioRead {
    return EstacionServicioMapper.normalizeRead({
      id: orm.id,
      nombre: orm.nombre,
      direccion: orm.direccion,
      nit: orm.nit ?? null,
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
      nit: nullIfAbsent(value.nit),
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
