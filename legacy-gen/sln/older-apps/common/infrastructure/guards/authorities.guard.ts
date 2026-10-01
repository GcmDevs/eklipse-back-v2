import { Reflector } from '@nestjs/core';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { getCodeAuthorities } from '@sln/old/common/infrastructure/services';
import { decodeToken } from '@sln/old/common/infrastructure/services';
import { ADMIN_AUTHORITY } from '@sln/old/authorities/principal';

@Injectable()
export class AuthoritiesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authorities = this.reflector.get<string[]>('authorities', context.getHandler());

    if (!authorities) return true;

    const tk = context.switchToHttp().getRequest().headers.authorization.split(' ')[1];
    const tkDec = decodeToken(tk);

    let userAuthorities: string[] = [];

    authorities.push(ADMIN_AUTHORITY);

    userAuthorities = await getCodeAuthorities(tkDec.id, tkDec.context);

    const hasAnyAuthority = () =>
      userAuthorities.some((authority: string) => authorities.includes(authority));

    return hasAnyAuthority();
  }
}
