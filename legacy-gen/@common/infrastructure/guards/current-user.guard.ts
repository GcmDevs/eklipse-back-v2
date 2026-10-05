import { UserRequest } from '@common/domain/types';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseSource, RequestContext } from '../services';

@Injectable()
export class CurrentUserGuard extends BaseSource {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const loggedUser = this.auth;
    if (!loggedUser) {
      throw new UnauthorizedException();
    }

    const userReq: UserRequest = {
      id: loggedUser.id,
      nombre: loggedUser.user.fullName,
      documento: loggedUser.user.document,
      table: loggedUser.tablePath,
      context: loggedUser.context,
    };
    req.user = userReq;
    RequestContext.setUsuario(userReq);
    return true;
  }
}
