import { ADMIN_AUTHORITY } from '@authorities/principal';
import { SelectQueryBuilder } from 'typeorm';
import { DataScopeType } from '../../domain/enums/data-scope.enum';
import {
  DataScopeFilters,
  DataScopeResult,
  IDataScopePolicy,
  UserContext,
} from '../../domain/interfaces/data-scope.interfaces';

export abstract class BaseDataScopePolicy<T> implements IDataScopePolicy<T> {
  protected abstract readonly authorityGlobal: string;
  protected readonly authorityTeam?: string;

  protected buildOwnerFilter(usuario: UserContext): DataScopeFilters {
    return { usuarioId: usuario.id };
  }

  protected buildTeamFilter(usuario: UserContext): DataScopeFilters {
    const areaId = usuario.metadatos?.areaId as number | undefined;
    return { areaId };
  }

  protected hasAuthority(usuario: UserContext, authority: string): boolean {
    return usuario.authorities.has(authority) || usuario.authorities.has(ADMIN_AUTHORITY);
  }

  async resolveScope(usuario: UserContext): Promise<DataScopeResult> {
    if (this.hasAuthority(usuario, this.authorityGlobal)) {
      return { tipo: DataScopeType.GLOBAL, filtros: {} };
    }

    if (this.authorityTeam && this.hasAuthority(usuario, this.authorityTeam)) {
      return {
        tipo: DataScopeType.TEAM,
        filtros: this.buildTeamFilter(usuario),
      };
    }

    return {
      tipo: DataScopeType.OWNER,
      filtros: this.buildOwnerFilter(usuario),
    };
  }

  abstract applyScope(
    qb: SelectQueryBuilder<T>,
    scope: DataScopeResult,
    alias: string
  ): SelectQueryBuilder<T>;
}
