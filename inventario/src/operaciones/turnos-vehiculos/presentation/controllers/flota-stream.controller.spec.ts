import { INN_AUTHORITIES } from '@inn/authorities';
import {
  AuthoritiesGuard,
  CurrentUserGuard,
  StrictJwtAuthGuard,
} from '@common/infrastructure/guards';
import { FlotaStreamController } from './flota-stream.controller';

describe('FlotaStreamController (metadatos de seguridad)', () => {
  it('exige el permiso OPERAR en el endpoint del stream', () => {
    const authorities = Reflect.getMetadata('authorities', FlotaStreamController.prototype.stream);
    expect(authorities).toEqual([INN_AUTHORITIES.GESTION_FLOTA.OPERAR]);
    expect(INN_AUTHORITIES.GESTION_FLOTA.OPERAR).toBe('006017001');
  });

  it('autentica con el guard estricto ANTES de resolver identidad y autorizar', () => {
    const guards = Reflect.getMetadata('__guards__', FlotaStreamController);
    expect(guards).toEqual([StrictJwtAuthGuard, CurrentUserGuard, AuthoritiesGuard]);
  });

  it('no declara parámetros @Query (no hay forma de recibir un token por URL)', () => {
    const args = Reflect.getMetadata(
      '__routeArguments__',
      FlotaStreamController,
      'stream',
    ) as Record<string, unknown> | undefined;
    // RouteParamtypes.QUERY = 4
    const tiposUsados = Object.keys(args ?? {}).map(k => Number(k.split(':')[0]));
    expect(tiposUsados).not.toContain(4);
  });
});
