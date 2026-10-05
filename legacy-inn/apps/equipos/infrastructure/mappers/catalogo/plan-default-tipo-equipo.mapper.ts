import { PlanDefaultTipoEquipo } from '@equipos/domain/entities/catalogo/plan-default-tipo-equipo.entity';
import { PlanDefaultTipoEquipoRead } from '@equipos/domain/read';
import { PlanDefaultTipoEquipoOrm } from '@orm/inn/equipos/catalogo/plan-default-tipo-equipo.orm';

export class PlanDefaultTipoEquipoMapper {
  static toDomain(orm: PlanDefaultTipoEquipoOrm): PlanDefaultTipoEquipo {
    return PlanDefaultTipoEquipo.rebuild(
      orm.id,
      orm.tipoEquipo?.id,
      orm.tipo,
      orm.createdAt,
      orm.updatedAt,
      orm.periocidad?.valor,
      orm.periocidad?.unidad,
      orm.diasAntNotif,
      orm.realizaExterno,
      orm.formato?.id,
      orm.observaciones,
      orm.activo ?? true
    );
  }

  static toOrm(domain: PlanDefaultTipoEquipo): PlanDefaultTipoEquipoOrm {
    const orm = new PlanDefaultTipoEquipoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.tipoEquipo = { id: domain.getTipoEquipoId.getValor } as any;
    orm.tipo = domain.getTipo;
    if (domain.getPeriocidadValor !== undefined || domain.getPeriocidadUnidad !== undefined) {
      orm.periocidad = {
        valor: domain.getPeriocidadValor,
        unidad: domain.getPeriocidadUnidad as any,
      };
    }
    orm.diasAntNotif = domain.getDiasAntNotif;
    orm.realizaExterno = domain.getRealizaExterno ?? false;
    if (domain.getFormatoId) orm.formato = { id: domain.getFormatoId } as any;
    orm.observaciones = domain.getObservaciones;
    orm.activo = domain.getActivo;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: PlanDefaultTipoEquipoOrm): PlanDefaultTipoEquipoRead {
    return {
      id: orm.id,
      tipoEquipoId: orm.tipoEquipo?.id,
      tipo: orm.tipo,
      periocidad:
        orm.periocidad?.valor != null && orm.periocidad?.unidad
          ? { valor: orm.periocidad.valor, unidad: orm.periocidad.unidad }
          : null,
      diasAntNotif: orm.diasAntNotif,
      realizaExterno: orm.realizaExterno,
      formatoId: orm.formato?.id,
      formatoNombre: orm.formato?.nombre,
      observaciones: orm.observaciones,
      activo: orm.activo ?? true,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toViewList(orms: PlanDefaultTipoEquipoOrm[]): PlanDefaultTipoEquipoRead[] {
    return orms.map(this.toView);
  }
}
