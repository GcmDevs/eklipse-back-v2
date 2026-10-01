import { JWTServices } from '@common/application/services';
import { UnauthenticatedError } from '@common/domain/errors';
import { GcmContextType } from '@common/domain/types';
import { fetchAuthsByUser } from '@common/infrastructure/services/authorities';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PermisoCacheService } from './permiso-cache.service';

@Injectable({ scope: Scope.REQUEST })
export class PermisoResolverService {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly permisoCache: PermisoCacheService,
  ) {}

  async resolveAuthorities(usuarioId: number): Promise<Set<string>> {
    const { context } = this.getAuth();
    const contextKey = String(context.getCode());
    const cached = this.permisoCache.get(usuarioId, contextKey);
    if (cached) return cached;

    const { onlyCodes } = await fetchAuthsByUser({
      id: usuarioId,
      ctx: context,
    });

    const authorities = new Set(onlyCodes);
    this.permisoCache.set(usuarioId, contextKey, authorities);
    return authorities;
  }

  private getAuth(): { id: number; context: GcmContextType } {
    try {
      const token = this.request.headers.authorization?.split(' ')[1];
      if (!token) throw new UnauthenticatedError('Token no proporcionado');

      const tokenDecoded = JWTServices.decodeToken(token);
      if (!tokenDecoded.tablePath) tokenDecoded.tablePath = 'GENUSUARIO';

      return {
        id: tokenDecoded.user.id,
        context: tokenDecoded.context,
      };
    } catch (error) {
      throw new UnauthenticatedError(error.message);
    }
  }
}
