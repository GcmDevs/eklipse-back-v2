import { BaseSource } from '@common/infrastructure/services';
import { EquipoOrm } from '@orm/inn/equipos';
import { SelectQueryBuilder } from 'typeorm';
import { EquiposExportFilters } from '../../../../domain/types/equipos';

export class TypeOrmEquiposReportListRepository extends BaseSource {
  private get repository() {
    return this.conn.getRepository(EquipoOrm);
  }

  public async findForExportList(filtros: EquiposExportFilters): Promise<EquipoOrm[]> {
    const qb = this.baseQb();
    this.applyFiltros(qb, filtros ?? {});
    qb.orderBy('equipo.numeroPlaca', 'ASC');
    return qb.getMany();
  }

  private baseQb(): SelectQueryBuilder<EquipoOrm> {
    return this.repository
      .createQueryBuilder('equipo')
      .leftJoinAndSelect('equipo.tipoEquipoRel', 'tipoEquipo')
      .leftJoinAndSelect('tipoEquipo.tipoActivo', 'tipoActivo')
      .leftJoinAndSelect('tipoEquipo.modelo', 'modelo')
      .leftJoinAndSelect('modelo.marca', 'marca')
      .leftJoinAndSelect('tipoEquipo.subclase', 'subclase')
      .leftJoinAndSelect('subclase.clase', 'clase')
      .leftJoinAndSelect('equipo.responsable', 'responsable')
      .leftJoinAndSelect('equipo.compra', 'compra');
  }

  private applyFiltros(qb: SelectQueryBuilder<EquipoOrm>, filtros: EquiposExportFilters): void {
    if (this.hasIds(filtros.tipoActivoIds)) {
      qb.andWhere('tipoActivo.id IN (:...tipoActivoIds)', {
        tipoActivoIds: filtros.tipoActivoIds,
      });
    }

    if (this.hasIds(filtros.claseIds)) {
      qb.andWhere('clase.id IN (:...claseIds)', {
        claseIds: filtros.claseIds,
      });
    }

    if (this.hasIds(filtros.subclaseIds)) {
      qb.andWhere('subclase.id IN (:...subclaseIds)', {
        subclaseIds: filtros.subclaseIds,
      });
    }

    if (this.hasIds(filtros.tipoEquipoIds)) {
      qb.andWhere('tipoEquipo.id IN (:...tipoEquipoIds)', {
        tipoEquipoIds: filtros.tipoEquipoIds,
      });
    }

    if (filtros.estadoEquipo?.length) {
      qb.andWhere('equipo.estado IN (:...estadoEquipo)', {
        estadoEquipo: filtros.estadoEquipo,
      });
    }

    if (filtros.localizacion != null && filtros.localizacion.trim() !== '') {
      qb.andWhere('equipo.localizacion LIKE :localizacion', {
        localizacion: `%${filtros.localizacion.trim()}%`,
      });
    }

    if (this.hasIds(filtros.responsableIds)) {
      qb.andWhere('responsable.responsableId IN (:...responsableIds)', {
        responsableIds: filtros.responsableIds,
      });
    }

    if (this.hasIds(filtros.compraIds)) {
      qb.andWhere('compra.id IN (:...compraIds)', {
        compraIds: filtros.compraIds,
      });
    }

    if (filtros.fechaAdquisicionDesde) {
      qb.andWhere('compra.fechaCompra >= :fechaAdquisicionDesde', {
        fechaAdquisicionDesde: filtros.fechaAdquisicionDesde,
      });
    }

    if (filtros.fechaAdquisicionHasta) {
      qb.andWhere('compra.fechaCompra <= :fechaAdquisicionHasta', {
        fechaAdquisicionHasta: filtros.fechaAdquisicionHasta,
      });
    }
  }

  private hasIds(ids?: number[]): ids is number[] {
    return Array.isArray(ids) && ids.length > 0;
  }
}
