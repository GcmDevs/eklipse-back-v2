import { Tanqueo } from '@vehiculos/domain/entities';
import {
  buildEvidenciasTanqueoRead,
  toMinimalTanqueoEvidenceRead,
} from '@vehiculos/domain/helpers/evidencias-lectura.helper';
import { EvidenciaTanqueoRead, ResumenTanqueosRead, TanqueoRead, UsuarioRefRead } from '@vehiculos/domain/reads';
import { Inconsistencia } from '@vehiculos/domain/types';
import { OrigenTanqueo } from '@vehiculos/domain/enums';
import { EstadoEvidencia } from '@vehiculos/domain/enums/estados.enum';
import {
  CantidadCombustible,
  CoordenadasGPS,
  EvidenciasTanqueo,
  Kilometraje,
  OrigenRegistro,
  ValorMonetario,
} from '@vehiculos/domain/value-objects';
import { EstacionServicioOrm, TanqueoOrm, VehiculoOrm } from '../persistence/orm';
import { CoordenadasEmbeddable, OrigenRegistroEmbeddable } from '../persistence/orm/supports';
import { AmbulanciaMapper } from './vehiculo.mapper';
import { EstacionServicioMapper } from './estacion-servicio.mapper';
import { TanqueoInconsistenciaMapper } from './tanqueo-inconsistencia.mapper';
import { nullIfAbsent } from '@common/presentation/helpers';

export class TanqueoMapper {
  static toDomain(orm: TanqueoOrm): Tanqueo {
    const ubicacion =
      orm.ubicacion?.latitud != null && orm.ubicacion?.longitud != null
        ? CoordenadasGPS.create(
            orm.ubicacion.latitud,
            orm.ubicacion.longitud,
            orm.ubicacion.precisionMetros ?? null
          )
        : null;

    const cantidadCombustible =
      orm.cantidadCombustible != null && orm.unidadMedidaCombustible
        ? CantidadCombustible.create(
            Number(orm.cantidadCombustible),
            orm.unidadMedidaCombustible,
            orm.tipoCombustible
          )
        : null;

    const inconsistencias: Inconsistencia[] =
      orm.inconsistencias?.map(item => ({
        codigo: item.codigo,
        campo: item.campo ?? null,
        severidad: item.severidad,
        mensaje: item.campo ? `${item.codigo}: ${item.campo}` : item.codigo,
        fechaResolucion: item.fechaResolucion ?? null,
      })) ?? [];

    return Tanqueo.rebuild(
      orm.id,
      orm.codigo ?? '',
      orm.activoId ?? 0,
      orm.usuario?.id ?? 0,
      orm.origen ?? OrigenTanqueo.ESTACION,
      orm.repositorio?.id ?? null,
      orm.kilometraje != null ? Kilometraje.create(orm.kilometraje) : null,
      orm.kilometrosRecorridos ?? null,
      orm.valorTotalPagado != null ? ValorMonetario.create(Number(orm.valorTotalPagado)) : null,
      cantidadCombustible,
      orm.tipoCombustible ?? cantidadCombustible?.getTipo ?? null,
      orm.rendimiento != null ? Number(orm.rendimiento) : null,
      orm.estacionServicioId ?? null,
      orm.fechaTanqueo,
      ubicacion,
      orm.observaciones ?? null,
      orm.estado,
      orm.evidencias ?? EvidenciasTanqueo.empty(),
      TanqueoMapper.toOrigenRegistroDomain(orm.origenRegistro, orm.clienteUuid),
      orm.decididoPorUsuario?.id ?? null,
      orm.fechaDecision ?? null,
      orm.motivoDecision ?? null,
      orm.aprobacionConOverride ?? false,
      inconsistencias,
      orm.createdAt,
      orm.updatedAt
    );
  }

  static toOrm(domain: Tanqueo): TanqueoOrm {
    const orm = new TanqueoOrm();
    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }
    orm.codigo = domain.getCodigo;
    orm.clienteUuid = domain.getOrigenRegistro.getClienteUuid || undefined;
    orm.activoId = domain.getActivoId.getValor;
    orm.origen = domain.getOrigen;
    if (domain.getRepositorioId) {
      orm.repositorio = { id: domain.getRepositorioId.getValor } as TanqueoOrm['repositorio'];
    }
    orm.usuario = { id: domain.getUsuarioId.getValor } as TanqueoOrm['usuario'];
    orm.kilometraje = domain.getKilometraje?.getValorEnKm;
    orm.kilometrosRecorridos = domain.getKilometrosRecorridos;
    orm.valorTotalPagado = domain.getValorTotalPagado?.getMonto;
    orm.cantidadCombustible = domain.getCantidadCombustible?.getValor;
    orm.unidadMedidaCombustible = domain.getCantidadCombustible?.getUnidadMedida;
    orm.tipoCombustible = domain.getTipoCombustible ?? undefined;
    orm.rendimiento = domain.getRendimiento;
    if (domain.getEstacionServicioId) {
      orm.estacionServicioId = domain.getEstacionServicioId.getValor;
    }
    orm.fechaTanqueo = domain.getFechaTanqueo;
    orm.ubicacion = TanqueoMapper.toCoordenadasEmbeddable(domain.getUbicacion);
    orm.observaciones = domain.getObservaciones;
    orm.estado = domain.getEstado;
    orm.evidencias = domain.getEvidencias;
    orm.evidenciasCompletas = domain.getEvidenciasCompletas;
    orm.origenRegistro = TanqueoMapper.toOrigenRegistroEmbeddable(domain.getOrigenRegistro);
    if (domain.getDecididoPorUsuarioId) {
      orm.decididoPorUsuario = {
        id: domain.getDecididoPorUsuarioId.getValor,
      } as TanqueoOrm['decididoPorUsuario'];
    }
    orm.fechaDecision = domain.getFechaDecision;
    orm.motivoDecision = domain.getMotivoDecision;
    orm.aprobacionConOverride = domain.getAprobacionConOverride;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toUpdateOrm(domain: Tanqueo): Partial<TanqueoOrm> {
    return {
      id: domain.getId.getValor,
      estado: domain.getEstado,
      observaciones: domain.getObservaciones,
      evidenciasCompletas: domain.getEvidenciasCompletas,
      decididoPorUsuario: domain.getDecididoPorUsuarioId
        ? ({ id: domain.getDecididoPorUsuarioId.getValor } as TanqueoOrm['decididoPorUsuario'])
        : undefined,
      fechaDecision: domain.getFechaDecision,
      motivoDecision: domain.getMotivoDecision,
      aprobacionConOverride: domain.getAprobacionConOverride,
      origenRegistro: TanqueoMapper.toOrigenRegistroEmbeddable(domain.getOrigenRegistro),
      updatedAt: domain.getUpdatedAt,
    };
  }

  static toViews(
    orms: TanqueoOrm[],
    vehiculos: Map<number, VehiculoOrm>,
    estaciones: Map<number, EstacionServicioOrm>
  ): TanqueoRead[] {
    return orms.map(orm =>
      TanqueoMapper.toView(
        orm,
        vehiculos.get(orm.activoId),
        estaciones.get(orm.estacionServicioId)
      )
    );
  }

  static toView(
    orm: TanqueoOrm,
    activo?: VehiculoOrm | null,
    estacionServicio?: EstacionServicioOrm | null
  ): TanqueoRead {
    const view = new TanqueoRead();
    view.id = orm.id;
    view.codigo = orm.codigo;
    view.clienteUuid = orm.clienteUuid ?? orm.origenRegistro?.clienteUuid;
    view.activo = activo ? AmbulanciaMapper.toView(activo) : undefined;
    view.origen = orm.origen ?? OrigenTanqueo.ESTACION;
    view.repositorioId = orm.repositorio?.id ?? null;
    view.repositorioNombre = orm.repositorio?.nombre ?? null;
    view.abastecimientoId = orm.abastecimiento?.id ?? null;
    view.abastecimientoCodigo = orm.abastecimiento?.codigo ?? null;
    view.usuarioId = orm.usuario?.id;
    view.usuarioNombre = orm.usuario?.nombreCompleto ?? '';
    view.kilometraje = orm.kilometraje;
    view.kilometrosRecorridos = orm.kilometrosRecorridos;
    view.valorTotalPagado =
      orm.valorTotalPagado != null ? Number(orm.valorTotalPagado) : null;
    view.cantidadCombustible =
      orm.cantidadCombustible != null ? Number(orm.cantidadCombustible) : undefined;
    view.unidadMedidaCombustible = orm.unidadMedidaCombustible;
    view.rendimiento = orm.rendimiento != null ? Number(orm.rendimiento) : undefined;
    view.tipoCombustible = orm.tipoCombustible;
    view.estacionServicio = estacionServicio
      ? EstacionServicioMapper.toView(estacionServicio)
      : undefined;
    view.fechaTanqueo = orm.fechaTanqueo;
    view.latitud = orm.ubicacion?.latitud;
    view.longitud = orm.ubicacion?.longitud;
    view.precisionMetros = orm.ubicacion?.precisionMetros;
    view.observaciones = orm.observaciones;
    view.estado = orm.estado;
    view.evidencias = buildEvidenciasTanqueoRead(
      orm.evidencias?.getEntradas() ?? [],
      orm.origen ?? OrigenTanqueo.ESTACION
    );
    view.evidenciasCompletas = orm.evidenciasCompletas;
    view.creadoOffline = orm.origenRegistro?.creadoOffline ?? false;
    view.fechaCreacionLocal = orm.origenRegistro?.fechaCreacionLocal;
    view.dispositivoId = orm.origenRegistro?.dispositivoId;
    view.fechaSincronizacion = orm.origenRegistro?.fechaSincronizacion;
    const inconsistencias = orm.inconsistencias ?? [];
    const inconsistenciasActivas = inconsistencias.filter(inc => !inc.fechaResolucion);
    view.cantidadInconsistencias = inconsistencias.length;
    view.cantidadInconsistenciasActivas = inconsistenciasActivas.length;
    view.tieneAlertas = inconsistenciasActivas.length > 0;
    view.inconsistencias = inconsistencias.map(TanqueoInconsistenciaMapper.toView);
    view.decididoPorUsuarioId = orm.decididoPorUsuario?.id ?? null;
    view.decididoPorNombre = orm.decididoPorUsuario?.nombreCompleto ?? null;
    view.decididoPor = orm.decididoPorUsuario?.id
      ? {
          id: orm.decididoPorUsuario.id,
          nombreCompleto: orm.decididoPorUsuario.nombreCompleto ?? '',
        }
      : undefined;
    view.fechaDecision = orm.fechaDecision;
    view.motivoDecision = orm.motivoDecision;
    view.aprobacionConOverride = orm.aprobacionConOverride ?? false;
    view.createdAt = orm.createdAt;
    view.updatedAt = orm.updatedAt;
    return TanqueoMapper.normalizeRead(view);
  }

  private static normalizeUsuarioRefRead(
    value: UsuarioRefRead | null | undefined
  ): UsuarioRefRead | null {
    if (!value) return null;
    return {
      id: value.id,
      nombreCompleto: value.nombreCompleto ?? '',
    };
  }

  private static normalizeEvidenciaRead(value: EvidenciaTanqueoRead): EvidenciaTanqueoRead {
    if (value.estado === EstadoEvidencia.NO_APLICA) {
      return toMinimalTanqueoEvidenceRead(value);
    }
    return {
      tipo: value.tipo,
      estado: value.estado,
      mediaId: nullIfAbsent(value.mediaId),
      motivoOmision: nullIfAbsent(value.motivoOmision),
      fecha: value.fecha!,
    };
  }

  private static normalizeRead(view: TanqueoRead): TanqueoRead {
    view.activo = nullIfAbsent(view.activo);
    view.kilometraje = nullIfAbsent(view.kilometraje);
    view.kilometrosRecorridos = nullIfAbsent(view.kilometrosRecorridos);
    view.valorTotalPagado = nullIfAbsent(view.valorTotalPagado);
    view.cantidadCombustible = nullIfAbsent(view.cantidadCombustible);
    view.unidadMedidaCombustible = nullIfAbsent(view.unidadMedidaCombustible);
    view.rendimiento = nullIfAbsent(view.rendimiento);
    view.estacionServicio = nullIfAbsent(view.estacionServicio);
    view.repositorioId = nullIfAbsent(view.repositorioId);
    view.repositorioNombre = nullIfAbsent(view.repositorioNombre);
    view.abastecimientoId = nullIfAbsent(view.abastecimientoId);
    view.abastecimientoCodigo = nullIfAbsent(view.abastecimientoCodigo);
    view.latitud = nullIfAbsent(view.latitud);
    view.longitud = nullIfAbsent(view.longitud);
    view.precisionMetros = nullIfAbsent(view.precisionMetros);
    view.observaciones = nullIfAbsent(view.observaciones);
    view.evidencias = (view.evidencias ?? []).map(TanqueoMapper.normalizeEvidenciaRead);
    view.fechaCreacionLocal = nullIfAbsent(view.fechaCreacionLocal);
    view.dispositivoId = nullIfAbsent(view.dispositivoId);
    view.fechaSincronizacion = nullIfAbsent(view.fechaSincronizacion);
    view.inconsistencias = view.inconsistencias ?? [];
    view.decididoPorUsuarioId = nullIfAbsent(view.decididoPorUsuarioId);
    view.decididoPorNombre = nullIfAbsent(view.decididoPorNombre);
    view.decididoPor = TanqueoMapper.normalizeUsuarioRefRead(view.decididoPor);
    view.fechaDecision = nullIfAbsent(view.fechaDecision);
    view.motivoDecision = nullIfAbsent(view.motivoDecision);
    return view;
  }

  private static toOrigenRegistroDomain(
    embeddable?: OrigenRegistroEmbeddable,
    clienteUuidFallback?: string
  ): OrigenRegistro {
    const clienteUuid = embeddable?.clienteUuid ?? clienteUuidFallback ?? '';
    let origen = OrigenRegistro.create({
      clienteUuid,
      creadoOffline: embeddable?.creadoOffline ?? false,
      fechaCreacionLocal: embeddable?.fechaCreacionLocal ?? new Date(),
      dispositivoId: embeddable?.dispositivoId ?? null,
    });
    if (embeddable?.fechaSincronizacion) {
      origen = origen.markSincronizacion(embeddable.fechaSincronizacion);
    }
    return origen;
  }

  private static toOrigenRegistroEmbeddable(
    origen: OrigenRegistro
  ): OrigenRegistroEmbeddable | undefined {
    const embeddable = new OrigenRegistroEmbeddable();
    embeddable.clienteUuid = origen.getClienteUuid;
    embeddable.creadoOffline = origen.getCreadoOffline;
    embeddable.fechaCreacionLocal = origen.getFechaCreacionLocal;
    embeddable.dispositivoId = origen.getDispositivoId;
    embeddable.fechaSincronizacion = origen.getFechaSincronizacion;
    return embeddable;
  }

  private static toCoordenadasEmbeddable(
    ubicacion: CoordenadasGPS | null
  ): CoordenadasEmbeddable | undefined {
    if (!ubicacion) return undefined;
    const embeddable = new CoordenadasEmbeddable();
    embeddable.latitud = ubicacion.getLatitud;
    embeddable.longitud = ubicacion.getLongitud;
    embeddable.precisionMetros = ubicacion.getPrecisionMetros;
    return embeddable;
  }
}
