import { MovimientoCombustible, RepositorioCombustible } from '@vehiculos/domain/entities';
import { buildEvidenciasTanqueoRead } from '@vehiculos/domain/helpers/evidencias-lectura.helper';
import { OrigenTanqueo } from '@vehiculos/domain/enums';
import { MovimientoCombustibleRead, RepositorioCombustibleRead } from '@vehiculos/domain/reads';
import {
  EstacionServicioOrm,
  MovimientoCombustibleOrm,
  RepositorioCombustibleOrm,
  VehiculoOrm,
} from '../persistence/orm';
import { AmbulanciaMapper } from './vehiculo.mapper';

export class RepositorioCombustibleMapper {
  static toDomain(orm: RepositorioCombustibleOrm): RepositorioCombustible {
    return RepositorioCombustible.rebuild(
      orm.id,
      orm.nombre,
      orm.tipoCombustible,
      orm.unidadMedida,
      Number(orm.capacidad),
      Number(orm.stockActual),
      orm.activo,
      orm.createdAt,
      orm.updatedAt
    );
  }

  static toOrm(domain: RepositorioCombustible): RepositorioCombustibleOrm {
    const orm = new RepositorioCombustibleOrm();
    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }
    orm.nombre = domain.getNombre;
    orm.tipoCombustible = domain.getTipoCombustible;
    orm.unidadMedida = domain.getUnidadMedida;
    orm.capacidad = domain.getCapacidad;
    orm.stockActual = domain.getStockActual;
    orm.activo = domain.getActivo;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: RepositorioCombustibleOrm): RepositorioCombustibleRead {
    return {
      id: orm.id,
      nombre: orm.nombre,
      tipoCombustible: orm.tipoCombustible,
      unidadMedidaCombustible: orm.unidadMedida,
      capacidad: Number(orm.capacidad),
      stockActual: Number(orm.stockActual),
      activo: orm.activo,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toMovimientoOrm(domain: MovimientoCombustible): MovimientoCombustibleOrm {
    const orm = new MovimientoCombustibleOrm();
    orm.repositorio = {
      id: domain.getRepositorioId.getValor,
    } as MovimientoCombustibleOrm['repositorio'];
    orm.tipo = domain.getTipo;
    orm.cantidad = domain.getCantidad;
    orm.stockResultante = domain.getStockResultante;
    orm.usuario = { id: domain.getUsuarioId.getValor } as MovimientoCombustibleOrm['usuario'];
    if (domain.getTanqueoId) {
      orm.tanqueo = { id: domain.getTanqueoId.getValor } as MovimientoCombustibleOrm['tanqueo'];
    }
    if (domain.getAbastecimientoId) {
      orm.abastecimiento = {
        id: domain.getAbastecimientoId.getValor,
      } as MovimientoCombustibleOrm['abastecimiento'];
    }
    orm.createdAt = domain.getCreatedAt;
    return orm;
  }

  static toMovimientoViews(
    orms: MovimientoCombustibleOrm[],
    vehiculos: Map<number, VehiculoOrm>,
    estaciones: Map<number, EstacionServicioOrm>
  ): MovimientoCombustibleRead[] {
    return orms.map(orm =>
      RepositorioCombustibleMapper.toMovimientoView(
        orm,
        vehiculos.get(orm.tanqueo?.activoId),
        estaciones.get(orm.abastecimiento?.estacionServicioId)
      )
    );
  }

  static toMovimientoView(
    orm: MovimientoCombustibleOrm,
    activo?: VehiculoOrm | null,
    estacionServicio?: EstacionServicioOrm | null
  ): MovimientoCombustibleRead {
    const tanqueo = orm.tanqueo;
    const abastecimiento = orm.abastecimiento;
    return {
      id: orm.id,
      repositorioId: orm.repositorio?.id,
      tipo: orm.tipo,
      cantidad: Number(orm.cantidad),
      stockResultante: Number(orm.stockResultante),
      usuario: orm.usuario?.id
        ? { id: orm.usuario.id, nombreCompleto: orm.usuario.nombreCompleto ?? '' }
        : null,
      tanqueo: tanqueo
        ? {
            id: tanqueo.id,
            codigo: tanqueo.codigo ?? null,
            fechaTanqueo: tanqueo.fechaTanqueo,
            estado: tanqueo.estado,
            cantidadCombustible:
              tanqueo.cantidadCombustible != null ? Number(tanqueo.cantidadCombustible) : null,
            kilometraje: tanqueo.kilometraje ?? null,
            evidenciasCompletas: tanqueo.evidenciasCompletas,
            evidencias: buildEvidenciasTanqueoRead(
              tanqueo.evidencias?.getEntradas() ?? [],
              tanqueo.origen ?? OrigenTanqueo.ESTACION
            ),
            activo: activo ? AmbulanciaMapper.toView(activo) : null,
          }
        : null,
      abastecimiento: abastecimiento
        ? {
            id: abastecimiento.id,
            codigo: abastecimiento.codigo,
            valorTotalPagado: Number(abastecimiento.valorTotalPagado),
            cantidadCombustible:
              abastecimiento.cantidadCombustible != null
                ? Number(abastecimiento.cantidadCombustible)
                : null,
            unidadMedidaCombustible: abastecimiento.unidadMedidaCombustible ?? null,
            tipoCombustible: abastecimiento.tipoCombustible,
            fechaAbastecimiento: abastecimiento.fechaAbastecimiento,
            estacionServicioId: abastecimiento.estacionServicioId ?? null,
            estacionServicioNombre: estacionServicio?.nombre ?? null,
            evidenciasCompletas: abastecimiento.evidenciasCompletas,
            evidencias: abastecimiento.evidencias?.getEntradas() ?? [],
          }
        : null,
      createdAt: orm.createdAt,
    };
  }
}
