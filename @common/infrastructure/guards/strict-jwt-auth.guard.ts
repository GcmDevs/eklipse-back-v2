import { processEnv } from '@env';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface StrictAuthRequest {
  headers: Record<string, string | string[] | undefined>;
  tokenExp?: number;
}

@Injectable()
export class StrictJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<StrictAuthRequest>();
    const header = req.headers?.authorization;
    const [scheme, token, extra] = (typeof header === 'string' ? header : '').trim().split(/\s+/);

    if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
      throw new UnauthorizedException('Token requerido en el encabezado Authorization (Bearer)');
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, processEnv.JWT_SECRET_KEY, {
        algorithms: ['HS512'],
      }) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (typeof payload.exp !== 'number') {
      throw new UnauthorizedException('Token sin fecha de expiración');
    }

    req.tokenExp = payload.exp;
    return true;
  }
}
