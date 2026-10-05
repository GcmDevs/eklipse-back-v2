import { FirmaService } from './firma.service';
import { UsuarioEqpService } from './usuario-eqp.service';

export * from './firma.service';
export * from './usuario-eqp.service';

export const FIRMAS_PROVIDERS = [FirmaService, UsuarioEqpService];
