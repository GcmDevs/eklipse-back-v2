import { ensureArray } from '@common/application/services';
import { ResponsableMapper } from '@core/terceros/infrastructure/mappers';
import { Equipo } from '@equipos/domain/entities';
import { EstadoEquipo, OrigenPlanEquipo, TipoActividad } from '@equipos/domain/enums';
import {
  EquipoMinimalRead,
  EquipoRead,
  PlanEquipoRead,
  ResumenEquiposRead,
} from '@equipos/domain/read';
import { ResponsableView } from '@orm/cor';
import { CompraOrm, EquipoOrm, PlanActividadOrm } from '@orm/inn/equipos';
import { PlanDefaultTipoEquipoOrm } from '@orm/inn/equipos/catalogo/plan-default-tipo-equipo.orm';
import { TipoEquipoOrm } from '@orm/inn/equipos/catalogo/tipo-equipo.orm';
import { PlanActividadMapper } from './actividades';
import { AccesorioUnidadMapper } from './accesorio-unidad.mapper';
import { EquipoBajaMapper } from './baja-equipo.mapper';
import { CompraMapper } from './catalogo/compra.mapper';
import { PlanDefaultTipoEquipoMapper } from './catalogo/plan-default-tipo-equipo.mapper';
import { TipoEquipoMapper } from './catalogo/tipo-equipo.mapper';

export class EquipoMapper {
  static toOrm(domain: Equipo): EquipoOrm {
    const orm = new EquipoOrm();

    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }
    orm.nombre = domain.getNombre;
    orm.codigo = domain.getCodigo;
    orm.numeroSerie = domain.getNumeroSerie;
    orm.numeroPlaca = domain.getNumeroPlaca;
    orm.numeroInventario = domain.getNumeroInventario;
    orm.responsable = { responsableId: domain.getResponsableId.getValor } as ResponsableView;
    orm.estado = domain.getEstado;
    orm.localizacion = domain.getLocalizacion;
    orm.tipoEquipoRel = domain.getTipoEquipoCatId
      ? ({ id: domain.getTipoEquipoCatId.getValor } as TipoEquipoOrm)
      : null;
    orm.planesActividad = PlanActividadMapper.toOrmList(domain.getPlanesActividad);
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    orm.fechaPuestaFuncionamiento = domain?.getFechaPuestaFuncionamiento;
    orm.observaciones = domain.getObservaciones;
    orm.isLegacy = domain?.getIsLegacy;
    orm.registroFotografico = domain?.getRegistroFotografico;
    orm.planDefaultMantenimiento = domain.getPlanDefaultMantenimientoId
      ? ({ id: domain.getPlanDefaultMantenimientoId.getValor } as PlanDefaultTipoEquipoOrm)
      : null;
    orm.planDefaultCalibracion = domain.getPlanDefaultCalibracionId
      ? ({ id: domain.getPlanDefaultCalibracionId.getValor } as PlanDefaultTipoEquipoOrm)
      : null;
    orm.compra = domain.getCompraId ? ({ id: domain.getCompraId.getValor } as CompraOrm) : null;

    return orm;
  }

  static toDomain(orm: EquipoOrm): Equipo {
    return Equipo.rebuild(
      orm.id,
      orm.nombre,
      orm.codigo,
      orm.numeroSerie,
      orm.numeroPlaca,
      orm.tipoEquipoRel?.id,
      orm.numeroInventario,
      PlanActividadMapper.toDomainList(orm.planesActividad),
      orm.responsable?.responsableId,
      orm.estado,
      orm.localizacion,
      orm.createdAt,
      orm.updatedAt,
      orm?.fechaPuestaFuncionamiento,
      orm.observaciones,
      orm?.isLegacy,
      orm?.compra?.id,
      orm?.registroFotografico,
      orm.planDefaultMantenimiento?.id,
      orm.planDefaultCalibracion?.id
    );
  }

  static toUpdateOrm(equipo: Equipo): Partial<EquipoOrm> {
    const updateEquipoOrm: Partial<EquipoOrm> = {
      id: equipo.getId.getValor,
      nombre: equipo?.getNombre,
      codigo: equipo?.getCodigo,
      numeroSerie: equipo?.getNumeroSerie,
      numeroPlaca: equipo?.getNumeroPlaca,
      numeroInventario: equipo?.getNumeroInventario,
      localizacion: equipo?.getLocalizacion,
      fechaPuestaFuncionamiento: equipo?.getFechaPuestaFuncionamiento,
      observaciones: equipo?.getObservaciones,
      responsable: { responsableId: equipo.getResponsableId.getValor } as ResponsableView,
      ...(equipo.getCompraId ? { compra: { id: equipo.getCompraId.getValor } as CompraOrm } : {}),
      ...(equipo.getTipoEquipoCatId
        ? { tipoEquipoRel: { id: equipo.getTipoEquipoCatId.getValor } as TipoEquipoOrm }
        : {}),
      ...(equipo.getPlanDefaultMantenimientoId
        ? {
            planDefaultMantenimiento: {
              id: equipo.getPlanDefaultMantenimientoId.getValor,
            } as PlanDefaultTipoEquipoOrm,
          }
        : {}),
      ...(equipo.getPlanDefaultCalibracionId
        ? {
            planDefaultCalibracion: {
              id: equipo.getPlanDefaultCalibracionId.getValor,
            } as PlanDefaultTipoEquipoOrm,
          }
        : {}),
    };

    return updateEquipoOrm;
  }

  static toUpdateEstadoOrm(equipo: Equipo): Pick<EquipoOrm, 'id' | 'estado'> {
    return {
      id: equipo.getId.getValor,
      estado: equipo.getEstado,
    };
  }

  static toView(orm: EquipoOrm): EquipoRead {
    const view = new EquipoRead();

    view.id = orm.id;
    view.nombre = orm.nombre;
    view.codigo = orm.codigo;
    view.numeroSerie = orm.numeroSerie;
    view.numeroPlaca = orm.numeroPlaca;
    view.numeroInventario = orm.numeroInventario;
    view.estado = orm.estado;
    view.localizacion = orm.localizacion;
    view.createdAt = orm.createdAt;
    view.updatedAt = orm.updatedAt;
    view.fechaPuestaFuncionamiento = orm?.fechaPuestaFuncionamiento ?? null;
    view.observaciones = orm?.observaciones ?? null;
    view.tipoActivoId = orm.tipoEquipoRel?.tipoActivo?.id;
    view.tipoActivoNombre = orm.tipoEquipoRel?.tipoActivo?.nombre;
    view.registroFotografico = orm?.registroFotografico?.getFotos() ?? [];
    view.tipoEquipo = orm.tipoEquipoRel ? TipoEquipoMapper.toEmbeddedView(orm.tipoEquipoRel) : null;
    view.accesoriosUnidad = (orm.accesoriosUnidad ?? [])
      .filter(a => !a.descontinuado)
      .map(a => ({
        ...AccesorioUnidadMapper.toView(a),
      }));

    const planes = ensureArray(orm.planesActividad);
    const mantenimiento = planes.find(p => p.tipo === TipoActividad.MANTENIMIENTO);
    const calibracion = planes.find(p => p.tipo === TipoActividad.CALIBRACION);

    view.planes = {
      mantenimiento: EquipoMapper.buildPlanView(
        mantenimiento,
        orm?.planDefaultMantenimiento,
        orm?.id,
        orm.tipoEquipoRel?.id
      ),
      calibracion: EquipoMapper.buildPlanView(
        calibracion,
        orm?.planDefaultCalibracion,
        orm?.id,
        orm.tipoEquipoRel?.id
      ),
    };

    view.responsable = orm.responsable?.responsableId
      ? ResponsableMapper.toResponse(orm.responsable)
      : null;

    view.baja = orm?.baja ? EquipoBajaMapper.toView(orm?.baja) : null;

    view.compra = orm.compra ? CompraMapper.toView(orm.compra) : null;

    return view;
  }

  private static buildPlanView(
    planActividad: PlanActividadOrm | undefined,
    planDefault: PlanDefaultTipoEquipoOrm | undefined,
    equipoId: number,
    tipoEquipoId?: number
  ): PlanEquipoRead | null {
    if (planActividad) {
      return {
        origen: OrigenPlanEquipo.PROPIO,
        equipoId,
        plan: PlanActividadMapper.toView(planActividad),
      };
    }

    if (planDefault) {
      return {
        origen: OrigenPlanEquipo.TIPO_EQUIPO,
        tipoEquipoId: tipoEquipoId ?? planDefault.tipoEquipo?.id,
        plan: PlanDefaultTipoEquipoMapper.toView(planDefault),
      };
    }

    return null;
  }

  static toResumenView(
    rows: {
      estado: EstadoEquipo;
      tipoActivoNombre: string | null;
      total: string;
    }[]
  ): ResumenEquiposRead {
    const porEstado = Object.values(EstadoEquipo).reduce(
      (acc, estado) => ({ ...acc, [estado]: 0 }),
      {} as Record<EstadoEquipo, number>
    );
    const porTipo: Record<string, number> = {};
    let totalFiltrado = 0;

    for (const row of rows) {
      const cantidad = Number(row.total);
      totalFiltrado += cantidad;
      porEstado[row.estado] = (porEstado[row.estado] ?? 0) + cantidad;

      const tipo = row.tipoActivoNombre ?? 'SIN_TIPO';
      porTipo[tipo] = (porTipo[tipo] ?? 0) + cantidad;
    }

    return { totalFiltrado, porEstado, porTipo };
  }

  static toMinimalView(orm: EquipoOrm): EquipoMinimalRead {
    const view = new EquipoMinimalRead();
    view.id = orm.id;
    view.nombre = orm.nombre;
    view.codigo = orm.codigo;
    view.numeroSerie = orm.numeroSerie;
    view.numeroPlaca = orm.numeroPlaca;
    view.numeroInventario = orm.numeroInventario;
    view.tipoActivoNombre = orm.tipoEquipoRel?.tipoActivo?.nombre;
    view.estado = orm.estado;
    view.localizacion = orm.localizacion;
    view.createdAt = orm.createdAt;
    view.updatedAt = orm.updatedAt;
    view.observaciones = orm.observaciones ?? null;
    view.fechaPuestaFuncionamiento = orm?.fechaPuestaFuncionamiento ?? null;
    view.responsable = orm.responsable?.responsableId
      ? ResponsableMapper.toResponse(orm.responsable)
      : null;

    return view;
  }
}
