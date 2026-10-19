import { TanqueoInconsistencia } from '@vehiculos/domain/entities';
import {
  TanqueoInconsistenciaContextRead,
  TanqueoInconsistenciaRead,
  TanqueoInconsistenciasGrupoRead,
} from '@vehiculos/domain/reads';
import { nullIfAbsent } from '@common/presentation/helpers';
import { TanqueoInconsistenciaOrm, TanqueoOrm, VehiculoOrm } from '../persistence/orm';

export class TanqueoInconsistenciaMapper {
  static toDomain(orm: TanqueoInconsistenciaOrm): TanqueoInconsistencia {
    return TanqueoInconsistencia.rebuild(
      orm.id,
      orm.tanqueo?.id,
      orm.codigo,
      orm.campo ?? null,
      orm.severidad,
      orm.fechaDeteccion,
      orm.resueltoPorUsuario?.id ?? null,
      orm.fechaResolucion ?? null,
      orm.contactoRealizado,
      orm.notaContacto ?? null,
      orm.notaResolucion ?? null
    );
  }

  static toOrm(domain: TanqueoInconsistencia): TanqueoInconsistenciaOrm {
    const orm = new TanqueoInconsistenciaOrm();
    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }
    orm.codigo = domain.getCodigo;
    orm.campo = domain.getCampo;
    orm.severidad = domain.getSeveridad;
    orm.fechaDeteccion = domain.getFechaDeteccion;
    orm.contactoRealizado = domain.getContactoRealizado;
    orm.fechaResolucion = domain.getFechaResolucion;
    orm.notaContacto = domain.getNotaContacto;
    orm.notaResolucion = domain.getNotaResolucion;
    orm.tanqueo = { id: domain.getTanqueoId.getValor } as TanqueoInconsistenciaOrm['tanqueo'];
    if (domain.getResueltoPorUsuarioId) {
      orm.resueltoPorUsuario = {
        id: domain.getResueltoPorUsuarioId.getValor,
      } as TanqueoInconsistenciaOrm['resueltoPorUsuario'];
    }
    return orm;
  }

  static toView(orm: TanqueoInconsistenciaOrm): TanqueoInconsistenciaRead {
    return TanqueoInconsistenciaMapper.normalizeRead({
      id: orm.id,
      tanqueoId: orm.tanqueo?.id ?? 0,
      codigo: orm.codigo,
      campo: orm.campo,
      severidad: orm.severidad,
      fechaDeteccion: orm.fechaDeteccion,
      resueltoPorUsuarioId: orm.resueltoPorUsuario?.id,
      resueltoPorNombre: orm.resueltoPorUsuario?.nombreCompleto,
      fechaResolucion: orm.fechaResolucion,
      contactoRealizado: orm.contactoRealizado,
      notaContacto: orm.notaContacto,
      notaResolucion: orm.notaResolucion,
    });
  }

  static toTanqueoContextView(
    tanqueo: TanqueoOrm,
    cantidadInconsistencias: number,
    activo?: VehiculoOrm | null
  ): TanqueoInconsistenciaContextRead {
    return TanqueoInconsistenciaMapper.normalizeContextRead({
      id: tanqueo.id,
      codigo: tanqueo.codigo ?? '',
      activoPlaca: activo?.placa ?? '',
      activoModelo: activo?.modelo?.nombre,
      usuarioNombre: tanqueo.usuario?.nombreCompleto ?? '',
      fechaTanqueo: tanqueo.fechaTanqueo,
      estado: tanqueo.estado,
      kilometraje: tanqueo.kilometraje ?? null,
      valorTotalPagado: tanqueo.valorTotalPagado != null ? Number(tanqueo.valorTotalPagado) : null,
      cantidadInconsistencias,
    });
  }

  static toGroupedView(
    orms: TanqueoInconsistenciaOrm[],
    orderedTanqueoIds: number[],
    activosPorId: Map<number, VehiculoOrm> = new Map()
  ): TanqueoInconsistenciasGrupoRead[] {
    const byTanqueo = new Map<number, TanqueoInconsistenciaOrm[]>();
    for (const orm of orms) {
      const tanqueoId = orm.tanqueo?.id;
      if (!tanqueoId) continue;
      const lista = byTanqueo.get(tanqueoId) ?? [];
      lista.push(orm);
      byTanqueo.set(tanqueoId, lista);
    }

    return orderedTanqueoIds
      .filter(id => byTanqueo.has(id))
      .map(tanqueoId => {
        const incOrms = byTanqueo.get(tanqueoId)!;
        const tanqueoOrm = incOrms[0].tanqueo;
        return TanqueoInconsistenciaMapper.normalizeGroupedRead({
          tanqueo: TanqueoInconsistenciaMapper.toTanqueoContextView(
            tanqueoOrm,
            incOrms.length,
            activosPorId.get(tanqueoOrm.activoId)
          ),
          inconsistencias: incOrms.map(TanqueoInconsistenciaMapper.toView),
        });
      });
  }

  private static normalizeRead(value: TanqueoInconsistenciaRead): TanqueoInconsistenciaRead {
    return {
      id: value.id,
      tanqueoId: value.tanqueoId,
      codigo: value.codigo,
      campo: nullIfAbsent(value.campo),
      severidad: value.severidad,
      fechaDeteccion: value.fechaDeteccion,
      resueltoPorUsuarioId: nullIfAbsent(value.resueltoPorUsuarioId),
      resueltoPorNombre: nullIfAbsent(value.resueltoPorNombre),
      fechaResolucion: nullIfAbsent(value.fechaResolucion),
      contactoRealizado: value.contactoRealizado,
      notaContacto: nullIfAbsent(value.notaContacto),
      notaResolucion: nullIfAbsent(value.notaResolucion),
    };
  }

  private static normalizeContextRead(
    value: TanqueoInconsistenciaContextRead
  ): TanqueoInconsistenciaContextRead {
    return {
      id: value.id,
      codigo: value.codigo,
      activoPlaca: value.activoPlaca,
      activoModelo: nullIfAbsent(value.activoModelo),
      usuarioNombre: value.usuarioNombre,
      fechaTanqueo: value.fechaTanqueo,
      estado: value.estado,
      kilometraje: value.kilometraje,
      valorTotalPagado: value.valorTotalPagado,
      cantidadInconsistencias: value.cantidadInconsistencias,
    };
  }

  private static normalizeGroupedRead(
    value: TanqueoInconsistenciasGrupoRead
  ): TanqueoInconsistenciasGrupoRead {
    return {
      tanqueo: value.tanqueo,
      inconsistencias: (value.inconsistencias ?? []).map(TanqueoInconsistenciaMapper.normalizeRead),
    };
  }
}
