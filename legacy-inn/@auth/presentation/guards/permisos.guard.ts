import { ADMIN_AUTHORITY } from '@authorities/principal';
import { ForbiddenAccessError } from '@common/domain/errors';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermisoResolverService } from '../../application/services/permiso-resolver.service';
import { PERMISOS_KEY } from '../decorators/permisos.decorator';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permisoResolver: PermisoResolverService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAuthorities = this.reflector.getAllAndOverride<string[]>(PERMISOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredAuthorities?.length) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenAccessError('Usuario no autenticado');

    const userAuthorities = await this.permisoResolver.resolveAuthorities(userId);
    const hasAuthority =
      requiredAuthorities.some(a => userAuthorities.has(a)) || userAuthorities.has(ADMIN_AUTHORITY);

    if (!hasAuthority) {
      throw new ForbiddenAccessError('No tiene permisos para esta operacion');
    }

    return true;
  }
}
