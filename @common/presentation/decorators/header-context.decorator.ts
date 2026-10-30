import { BadInputError } from '@common/domain/errors';
import { gcmContextByNumericCode, GcmContextType } from '@common/domain/types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const HEADER = 'ctx';
/** Header `ctx`: código numérico de tenant/sede (mismo contrato que media y tanqueos transversales). */
export function extractTenantContext(request: Request): GcmContextType | undefined {
  const raw = request.headers[HEADER];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.toString().trim();
  if (value == null || value === '') {
    return undefined;
  }

  const numeric = Number(value);
  if (!Number.isInteger(numeric)) {
    throw new BadInputError('El header ctx debe ser un codigo numerico de contexto');
  }

  try {
    return gcmContextByNumericCode(numeric);
  } catch {
    throw new BadInputError('El header ctx no corresponde a un contexto válido');
  }
}

/** @deprecated Usar extractTenantContext */
export const extractMediaContext = extractTenantContext;

export const MediaContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): GcmContextType | undefined => {
    return extractTenantContext(context.switchToHttp().getRequest());
  }
);
