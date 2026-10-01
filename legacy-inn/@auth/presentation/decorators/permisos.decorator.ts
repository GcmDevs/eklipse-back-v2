import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const PERMISOS_KEY = 'permisos';

export const Permisos = (...authorities: string[]): CustomDecorator<string> =>
  SetMetadata(PERMISOS_KEY, authorities);
