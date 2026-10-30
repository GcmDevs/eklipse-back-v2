import { FirmaController } from './firma.controller';
import { UsuarioController } from './usuario.controller';

export * from './firma.controller';
export * from './usuario.controller';

export const IDENTITY_CONTROLLERS = [FirmaController, UsuarioController];
