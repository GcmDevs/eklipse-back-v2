import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserScopeContext } from '../../domain/interfaces/data-scope.interfaces';

export const UserScope = createParamDecorator((ctx: ExecutionContext): UserScopeContext => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return {
    id: user.id,
    metadatos: {
      areaId: user.areaId,
    },
  };
});
