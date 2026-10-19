import { processEnv } from '@env';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { ENVIRONMENTS } from 'src/app.environments';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    try {
      let token = context.switchToHttp().getRequest().headers.authorization.split(' ')[1];
      if (ENVIRONMENTS.production) jwt.verify(token, processEnv.JWT_SECRET_KEY);
      else {
        const tkDcd = jwt.decode(token);
        if (!tkDcd) throw new Error('In development, you need at least a real token');
      }
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
