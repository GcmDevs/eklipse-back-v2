import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthoritiesGuard } from '@common/infrastructure/guards/authorities.guard';
import { fetchAuthsByUser } from '@common/infrastructure/services';
import { InvimaController } from './invima.controller';
import { RecepcionInvimaController } from './recepcion.controller';
import { FisicoRecepcionDto, GuardarRecepcionItemDto } from './recepcion.dto';
import { fisicoVacio } from '../domain/recepcion.models';
import { FacturasInvimaController } from './facturas.controller';
import {
  EliminarFacturaDto,
  GuardarFacturaDto,
  ListarFacturasDto,
  ObservacionFacturaDto,
} from './factura.dto';
import { ConfirmarCandidatoDto, GuardarMedicamentoDto, PaginaCandidatoDto } from './invima.dto';
import { TIPOS_PRODUCTO_INVIMA } from '../domain/invima.models';

jest.mock('@common/application/services', () => ({
  JWTServices: { decodeToken: () => ({ passWasReset: false }) },
}));
jest.mock('@common/infrastructure/services', () => ({ fetchAuthsByUser: jest.fn() }));
jest.mock('../application/invima.service', () => ({ InvimaService: class {} }));
jest.mock('../application/recepcion.service', () => ({ RecepcionInvimaService: class {} }));
jest.mock('../application/facturas.service', () => ({ FacturasInvimaService: class {} }));
jest.mock('@common/infrastructure/guards', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
  AuthoritiesGuard: jest.requireActual('@common/infrastructure/guards/authorities.guard')
    .AuthoritiesGuard,
}));
describe('Permisos de las interfaces INVIMA', () => {
  it.each(['iniciar', 'detalle', 'guardar', 'finalizar'])(
    'recepción %s exige administrador o permiso INVIMA',
    method => {
      expect(
        Reflect.getMetadata('authorities', RecepcionInvimaController.prototype[method])
      ).toEqual([ADMIN_AUTHORITY, '006005002']);
      expect(Reflect.getMetadata(GUARDS_METADATA, RecepcionInvimaController)).toHaveLength(2);
    }
  );
  it('valida captura física sin coerción y exige versiones y contenido', async () => {
    const base = {
      version: 1,
      recepcionVersion: 1,
      decision: 'PENDIENTE',
      justificacion: '',
      fisico: fisicoVacio('MEDICAMENTO'),
    };
    expect(
      await validate(plainToInstance(GuardarRecepcionItemDto, base), { whitelist: true })
    ).toHaveLength(0);
    for (const fisico of [
      undefined,
      null,
      { ...base.fisico, cantidad: '60' },
      { ...base.fisico, estadoEmpaque: 'INVALIDO' },
      { ...base.fisico, motivosRechazo: ['OTRO'] },
    ])
      expect(
        (
          await validate(plainToInstance(GuardarRecepcionItemDto, { ...base, fisico }), {
            whitelist: true,
          })
        ).length
      ).toBeGreaterThan(0);
  });
  it.each([
    'subir',
    'subirPedido',
    'listar',
    'detalle',
    'guardar',
    'eliminar',
    'observacion',
    'informe',
  ])('protege el endpoint de facturas %s', async method => {
    const handler = FacturasInvimaController.prototype[method];
    expect(Reflect.getMetadata('authorities', handler)).toEqual([ADMIN_AUTHORITY, '006005002']);
    expect(Reflect.getMetadata(GUARDS_METADATA, FacturasInvimaController)).toHaveLength(2);
    const ctx: any = {
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer prueba' } }),
      }),
    };
    for (const [codes, allowed] of [
      [[ADMIN_AUTHORITY], true],
      [['006005002'], true],
      [[], false],
    ] as const) {
      (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: codes });
      expect(await new AuthoritiesGuard(new Reflector()).canActivate(ctx)).toBe(allowed);
    }
  });
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
  it('valida lotes declarados como lista acotada y rechaza null, duplicados y tipos ajenos', async () => {
    const { RenglonFacturaDto } = await import('./factura.dto');
    const base = {
      tipo: 'MEDICAMENTO',
      descripcion: 'Producto',
      codigoDeclarado: '',
      registroSanitario: '',
      excluido: false,
    };
    for (const lotesDeclarados of [undefined, [], ['000A', '000B']])
      expect(
        await validate(plainToInstance(RenglonFacturaDto, { ...base, lotesDeclarados }))
      ).toHaveLength(0);
    for (const lotesDeclarados of [null, '000A', [123], ['A', 'A'], ['A'.repeat(121)]])
      expect(
        (await validate(plainToInstance(RenglonFacturaDto, { ...base, lotesDeclarados }))).length
      ).toBeGreaterThan(0);
  });
  it('valida cantidades opcionales sin convertir vacíos, fórmulas ni textos a números', async () => {
    const base = {
      tipo: 'MEDICAMENTO',
      descripcion: 'Producto',
      codigoDeclarado: '',
      registroSanitario: '',
      excluido: false,
    };
    const { RenglonFacturaDto } = await import('./factura.dto');
    for (const cantidad of [0, 42, 1.5, null, undefined])
      expect(
        await validate(
          plainToInstance(RenglonFacturaDto, { ...base, cantidad, cantidadPresentacion: cantidad }),
          { whitelist: true }
        )
      ).toHaveLength(0);
    for (const cantidad of [-1, Infinity, NaN, '42', '', Number.MAX_SAFE_INTEGER + 1])
      expect(
        (await validate(plainToInstance(RenglonFacturaDto, { ...base, cantidad }))).length
      ).toBeGreaterThan(0);
  });
  it('valida longitud, versión y pertenencia del renglón y descarta identidad en observaciones', async () => {
    for (const invalid of [
      { texto: 'x'.repeat(4001), version: 0 },
      { texto: 'nota', version: -1 },
      { texto: 'nota', version: 0, renglonId: 0 },
      { texto: null, version: 0 },
    ])
      expect(
        (await validate(plainToInstance(ObservacionFacturaDto, invalid))).length
      ).toBeGreaterThan(0);
    const valid = plainToInstance(ObservacionFacturaDto, {
      texto: '\nNota & detalle\n',
      version: 0,
      renglonId: 2,
      usuarioNombre: 'Impostor',
      context: 'otro',
    });
    expect(await validate(valid, { whitelist: true })).toHaveLength(0);
    expect(valid.texto).toBe('\nNota & detalle\n');
    expect(valid).not.toHaveProperty('usuarioNombre');
    expect(valid).not.toHaveProperty('context');
  });
  it.each(TIPOS_PRODUCTO_INVIMA)(
    'acepta %s en productos y renglones, conservando códigos declarados como texto',
    async tipo => {
      const producto = plainToInstance(GuardarMedicamentoDto, {
        tipo,
        nombre: 'Producto',
        codigoDeclarado: '0000042',
        version: 1,
      });
      expect(await validate(producto, { whitelist: true })).toHaveLength(0);
      expect(producto.codigoDeclarado).toBe('0000042');
      const factura = plainToInstance(GuardarFacturaDto, {
        version: 1,
        numero: 'F-1',
        proveedor: 'Proveedor',
        nitProveedor: '',
        renglones: [
          {
            tipo,
            descripcion: 'Producto',
            codigoDeclarado: '0000042',
            registroSanitario: '',
            excluido: false,
          },
        ],
      });
      expect(await validate(factura, { whitelist: true })).toHaveLength(0);
    }
  );
  it('solo permite los estados publicados para filtrar facturas', async () => {
    expect(await validate(plainToInstance(ListarFacturasDto, { estado: 'BORRADOR' }))).toHaveLength(
      0
    );
    expect(await validate(plainToInstance(ListarFacturasDto, { estado: 'REVISADA' }))).toHaveLength(
      0
    );
    expect(
      (await validate(plainToInstance(ListarFacturasDto, { estado: 'OTRO' }))).length
    ).toBeGreaterThan(0);
  });
  it('exige una versión positiva para eliminar borradores', async () => {
    for (const version of [undefined, 0, -1, 'abc'])
      expect(
        (await validate(plainToInstance(EliminarFacturaDto, { version }))).length
      ).toBeGreaterThan(0);
    expect(await validate(plainToInstance(EliminarFacturaDto, { version: '1' }))).toHaveLength(0);
  });
  it('valida renglones anidados y descarta evidencia, contexto e identidad enviados por el cliente', async () => {
    const dto = plainToInstance(GuardarFacturaDto, {
      version: 1,
      numero: 'F1',
      proveedor: 'Proveedor',
      nitProveedor: '',
      context: 'ajeno',
      creadoPor: 99,
      renglones: [
        {
          tipo: 'MEDICAMENTO',
          descripcion: 'Producto',
          codigoDeclarado: '0001-01',
          registroSanitario: '',
          excluido: false,
          original: 'falso',
        },
      ],
    });
    expect(await validate(dto, { whitelist: true })).toHaveLength(0);
    expect(dto).not.toHaveProperty('context');
    expect(dto.renglones[0]).not.toHaveProperty('original');
    dto.renglones[0].tipo = 'INVALIDO' as any;
    expect((await validate(dto, { whitelist: true })).length).toBeGreaterThan(0);
  });
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
