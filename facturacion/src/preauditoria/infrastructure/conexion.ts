import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { JWTServices } from '@common/application/services';
import { GcmContexts } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services/connections';

/** La base de operación se obtiene exclusivamente del contexto de la sesión. */
export function conexionPre(request: Request): DataSource {
  const token = /^Bearer\s+(\S+)\s*$/i.exec(request.headers.authorization ?? '')?.[1];
  if (!token) throw new UnauthorizedException('Se requiere una sesión de Eklipse.');
  let sesion: ReturnType<typeof JWTServices.decodeToken>;
  try {
    sesion = JWTServices.decodeToken(token);
  } catch {
    throw new UnauthorizedException('La sesión de Eklipse no es válida.');
  }
  if (
    !sesion?.isDim ||
    sesion.passWasReset ||
    !sesion.context ||
    sesion.context.getCode() === GcmContexts.EKLIPSE
  ) {
    throw new ForbiddenException(
      'Preauditoría requiere una sesión interna en el contexto de una sede.'
    );
  }
  return switchConn(sesion.context);
}
