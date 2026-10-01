import { SelectQueryBuilder } from 'typeorm';
import { DataScopeType } from '../enums/data-scope.enum';

export interface UserContext {
  id: number;
  nombre: string;
  authorities: Set<string>;
  metadatos?: Record<string, unknown>;
}

export interface UserScopeContext {
  id: number;
  metadatos?: Record<string, unknown>;
}

export interface DataScopeResult {
  tipo: DataScopeType;
  filtros: DataScopeFilters;
}

export interface DataScopeFilters {
  usuarioId?: number;
  areaId?: number;
  extra?: Record<string, unknown>;
}

export interface IDataScopePolicy<T> {
  resolveScope(usuario: UserContext): Promise<DataScopeResult>;

  applyScope(
    qb: SelectQueryBuilder<T>,
    scope: DataScopeResult,
    alias: string,
  ): SelectQueryBuilder<T>;
}
