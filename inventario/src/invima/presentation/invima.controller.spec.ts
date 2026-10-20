import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthoritiesGuard } from '@common/infrastructure/guards/authorities.guard';
import { fetchAuthsByUser } from '@common/infrastructure/services';
import { InvimaController } from './invima.controller';
import { ConfirmarCandidatoDto, GuardarMedicamentoDto, PaginaCandidatoDto } from './invima.dto';

jest.mock('@common/application/services', () => ({
  JWTServices: { decodeToken: () => ({ passWasReset: false }) },
}));
jest.mock('@common/infrastructure/services', () => ({ fetchAuthsByUser: jest.fn() }));
jest.mock('../application/invima.service', () => ({ InvimaService: class {} }));
jest.mock('@common/infrastructure/guards', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
  AuthoritiesGuard: jest.requireActual('@common/infrastructure/guards/authorities.guard')
    .AuthoritiesGuard,
}));
describe('Permisos de las interfaces INVIMA', () => {
  it.each(['listar', 'crear', 'editar', 'verificar', 'historial', 'candidatos', 'confirmar'])(
    'permite administrador o permiso específico en %s',
    method => {
      expect(Reflect.getMetadata('authorities', InvimaController.prototype[method])).toEqual([
        ADMIN_AUTHORITY,
        '006005002',
      ]);
      expect(Reflect.getMetadata(GUARDS_METADATA, InvimaController)).toHaveLength(2);
    }
  );
  it.each([
    ['006005002', true],
    [ADMIN_AUTHORITY, true],
    ['006005001', false],
    ['', false],
  ])('evalúa el acceso con permiso %s', async (authority, allowed) => {
    (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: authority ? [authority] : [] });
    const ctx: any = {
      getHandler: () => InvimaController.prototype.listar,
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer token-de-prueba' } }),
      }),
    };
    expect(await new AuthoritiesGuard(new Reflector()).canActivate(ctx)).toBe(allowed);
  });
  it.each(['listar', 'crear', 'editar', 'verificar', 'historial', 'candidatos', 'confirmar'])(
    'autoriza al administrador sin permiso INVIMA en %s y conserva los metadatos',
    async method => {
      (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: [ADMIN_AUTHORITY] });
      const handler = InvimaController.prototype[method];
      const original = [...Reflect.getMetadata('authorities', handler)];
      const context: any = {
        getHandler: () => handler,
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'Bearer token-de-prueba' } }),
        }),
      };
      const guard = new AuthoritiesGuard(new Reflector());
      expect(await guard.canActivate(context)).toBe(true);
      expect(await guard.canActivate(context)).toBe(true);
      expect(Reflect.getMetadata('authorities', handler)).toEqual(original);
    }
  );
});
describe('Validación de entrada INVIMA', () => {
  it.each([
    { nombre: '' },
    { nombre: '  ' },
    { nombre: 'X', cum: '1 OR 1=1' },
    { nombre: 'X', nombreExtra: 'ignored', version: 0 },
  ])('rechaza entradas inválidas %j', async input => {
    const errors = await validate(plainToInstance(GuardarMedicamentoDto, input), {
      whitelist: true,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
  it('conserva los ceros del CUM y descarta propiedades ajenas', async () => {
    const input = plainToInstance(GuardarMedicamentoDto, {
      nombre: '  CARDIK  ',
      cum: '00020048021-00041',
      context: 'otro',
      usuarioId: 99,
    });
    expect(await validate(input, { whitelist: true })).toHaveLength(0);
    expect(input.nombre).toBe('CARDIK');
    expect(input.cum).toBe('00020048021-00041');
    expect(input).not.toHaveProperty('context');
    expect(input).not.toHaveProperty('usuarioId');
  });
  it('valida fuente y offset de candidatos y rechaza claves inventadas', async () => {
    expect(
      await validate(plainToInstance(PaginaCandidatoDto, { fuenteId: 'vigentes', offset: '20' }))
    ).toHaveLength(0);
    expect(
      await validate(
        plainToInstance(PaginaCandidatoDto, { fuenteId: 'https://otro', offset: '-1' })
      )
    ).toHaveLength(2);
    expect(
      (await validate(plainToInstance(ConfirmarCandidatoDto, { clave: 'identificador-inventado' })))
        .length
    ).toBeGreaterThan(0);
  });
});
