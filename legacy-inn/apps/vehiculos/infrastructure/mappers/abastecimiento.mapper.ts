import { Abastecimiento } from '@vehiculos/domain/entities';
import { AbastecimientoRead } from '@vehiculos/domain/reads';
import {
  CantidadCombustible,
  CoordenadasGPS,
  EvidenciasTanqueo,
  ValorMonetario,
} from '@vehiculos/domain/value-objects';
import { AbastecimientoOrm } from '../persistence/orm';
import { CoordenadasEmbeddable } from '../persistence/orm/supports';

export class AbastecimientoMapper {
  static toDomain(orm: AbastecimientoOrm): Abastecimiento {
    const ubicacion =
      orm.ubicacion?.latitud != null && orm.ubicacion?.longitud != null
        ? CoordenadasGPS.create(
            orm.ubicacion.latitud,
            orm.ubicacion.longitud,
            orm.ubicacion.precisionMetros ?? null
          )
        : null;
    return Abastecimiento.rebuild(
      orm.id,
      orm.codigo,
      orm.estacionServicioId ?? 0,
      orm.usuario?.id ?? 0,
      ValorMonetario.create(Number(orm.valorTotalPagado)),
      orm.cantidadCombustible != null && orm.unidadMedidaCombustible
        ? CantidadCombustible.create(
            Number(orm.cantidadCombustible),
            orm.unidadMedidaCombustible,
            orm.tipoCombustible
          )
        : null,
      orm.tipoCombustible,
      orm.fechaAbastecimiento,
      ubicacion,
      orm.observaciones ?? null,
      orm.evidencias ?? EvidenciasTanqueo.empty(),
      orm.tanqueo?.id ?? null,
      orm.repositorio?.id ?? null,
      orm.clienteUuid ?? null,
      orm.createdAt,
      orm.updatedAt
    );
  }

  static toOrm(domain: Abastecimiento): AbastecimientoOrm {
    const orm = new AbastecimientoOrm();
    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }
    orm.codigo = domain.getCodigo;
    orm.clienteUuid = domain.getClienteUuid ?? undefined;
    orm.estacionServicioId = domain.getEstacionServicioId.getValor;
    orm.usuario = { id: domain.getUsuarioId.getValor } as AbastecimientoOrm['usuario'];
    orm.valorTotalPagado = domain.getValorTotalPagado.getMonto;
    orm.cantidadCombustible = domain.getCantidadCombustible?.getValor;
    orm.unidadMedidaCombustible = domain.getUnidadMedida;
    orm.tipoCombustible = domain.getTipoCombustible;
    orm.fechaAbastecimiento = domain.getFechaAbastecimiento;
    orm.ubicacion = AbastecimientoMapper.toCoordenadas(domain.getUbicacion);
    orm.observaciones = domain.getObservaciones;
    orm.evidencias = domain.getEvidencias;
    orm.evidenciasCompletas = domain.getEvidenciasCompletas;
    if (domain.getTanqueoId) {
      orm.tanqueo = { id: domain.getTanqueoId.getValor } as AbastecimientoOrm['tanqueo'];
    }
    if (domain.getRepositorioId) {
      orm.repositorio = {
        id: domain.getRepositorioId.getValor,
      } as AbastecimientoOrm['repositorio'];
    }
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: AbastecimientoOrm): AbastecimientoRead {
    return {
      id: orm.id,
      codigo: orm.codigo,
      estacionServicioId: orm.estacionServicioId,
      usuarioId: orm.usuario?.id,
      valorTotalPagado: Number(orm.valorTotalPagado),
      cantidadCombustible:
        orm.cantidadCombustible != null ? Number(orm.cantidadCombustible) : null,
      unidadMedidaCombustible: orm.unidadMedidaCombustible,
      tipoCombustible: orm.tipoCombustible,
      fechaAbastecimiento: orm.fechaAbastecimiento,
      tanqueoId: orm.tanqueo?.id ?? null,
      repositorioId: orm.repositorio?.id ?? null,
      evidenciasCompletas: orm.evidenciasCompletas,
      evidencias: orm.evidencias?.getEntradas() ?? [],
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  private static toCoordenadas(ubicacion: CoordenadasGPS | null): CoordenadasEmbeddable | undefined {
    if (!ubicacion) return undefined;
    const embeddable = new CoordenadasEmbeddable();
    embeddable.latitud = ubicacion.getLatitud;
    embeddable.longitud = ubicacion.getLongitud;
    embeddable.precisionMetros = ubicacion.getPrecisionMetros;
    return embeddable;
  }
}
