import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import {
  IDataScopePolicy,
  UserContext,
  UserScopeContext,
} from '../../domain/interfaces/data-scope.interfaces';
import { PermisoResolverService } from './permiso-resolver.service';

@Injectable()
export class DataScopeService {
  constructor(private readonly permisoResolver: PermisoResolverService) {}

  async apply<T>(
    usuarioCtx: UserScopeContext,
    qb: SelectQueryBuilder<T>,
    alias: string,
    policy: IDataScopePolicy<T>
  ): Promise<SelectQueryBuilder<T>> {
    const authorities = await this.permisoResolver.resolveAuthorities(usuarioCtx.id);

    const usuario: UserContext = {
      id: usuarioCtx.id,
      nombre: '',
      authorities,
      metadatos: usuarioCtx.metadatos ?? {},
    };

    const scope = await policy.resolveScope(usuario);
    return policy.applyScope(qb, scope, alias);
  }
}
