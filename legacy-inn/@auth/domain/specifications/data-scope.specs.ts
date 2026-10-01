import { SelectQueryBuilder } from 'typeorm';
import { DataScopeFilters } from '../interfaces/data-scope.interfaces';


export class DataScopeSpecs {

  static onlyFromUsuario<T>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    campo: string,
    filtros: DataScopeFilters,
  ): SelectQueryBuilder<T> {
    return qb.andWhere(`${alias}.${campo} = :scopeUsuarioId`, {
      scopeUsuarioId: filtros.usuarioId,
    });
  }

  static onlyFromArea<T>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    campo: string,
    filtros: DataScopeFilters,
  ): SelectQueryBuilder<T> {
    return qb.andWhere(`${alias}.${campo} = :scopeAreaId`, {
      scopeAreaId: filtros.areaId,
    });
  }

  static global<T>(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    return qb;
  }

  static onlyIds<T>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    campo: string,
    ids: number[],
  ): SelectQueryBuilder<T> {
    if (!ids.length) {
      return qb.andWhere('1 = 0');
    }
    return qb.andWhere(`${alias}.${campo} IN (:...scopeIds)`, {
      scopeIds: ids,
    });
  }
}
