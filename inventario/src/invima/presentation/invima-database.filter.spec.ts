import { ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { InvimaDatabaseFilter } from './invima-database.filter';

describe('Diagnóstico de instalación INVIMA', () => {
  const response = {};
  const host = { switchToHttp: () => ({ getResponse: () => response }) } as ArgumentsHost;
  it.each(['OBSERVACION', 'OBSVERSION', 'OBSUSUARIO', 'OBSNOMBRE', 'OBSFECHA'])(
    'identifica la migración de observaciones pendiente: %s',
    columna => {
      const reply = jest.fn();
      const adapterHost = { httpAdapter: { reply } } as unknown as HttpAdapterHost;
      new InvimaDatabaseFilter(adapterHost).catch(
        new QueryFailedError(
          'SELECT ...',
          [],
          Object.assign(new Error(`Invalid column name '${columna}'.`), { number: 207 })
        ),
        host
      );
      expect(reply).toHaveBeenCalledWith(
        response,
        expect.objectContaining({
          message: expect.stringContaining('20261022_invima_observaciones.sql'),
        }),
        503
      );
    }
  );
  it.each(['FECHAELIMINA', 'ELIMINADOPOR'])(
    'identifica la migración de borrado lógico pendiente: %s',
    columna => {
      const reply = jest.fn();
      const adapterHost = { httpAdapter: { reply } } as unknown as HttpAdapterHost;
      new InvimaDatabaseFilter(adapterHost).catch(
        new QueryFailedError(
          'SELECT ...',
          [],
          Object.assign(new Error(`Invalid column name '${columna}'.`), { number: 207 })
        ),
        host
      );
      expect(reply).toHaveBeenCalledWith(
        response,
        expect.objectContaining({
          message: expect.stringContaining('20261021_invima_facturas_soft_delete.sql'),
        }),
        503
      );
    }
  );

  it.each(['EKINNIVPRODUCTO', 'EKINNIVVERIFICACION', 'EKINNIVCONFIRMACION'])(
    'explica la ausencia de %s sin devolver un listado vacío',
    table => {
      const reply = jest.fn();
      const adapterHost = { httpAdapter: { reply } } as unknown as HttpAdapterHost;
      const driverError = Object.assign(new Error(`Invalid object name '${table}'.`), {
        number: 208,
      });
      new InvimaDatabaseFilter(adapterHost).catch(
        new QueryFailedError('SELECT ...', [], driverError),
        host
      );
      expect(reply).toHaveBeenCalledWith(
        response,
        expect.objectContaining({ code: 'INVIMA_MIGRACION_PENDIENTE', statusCode: 503 }),
        503
      );
    }
  );

  it('no confunde otros errores SQL con una migración pendiente', () => {
    const fallback = jest.spyOn(BaseExceptionFilter.prototype, 'catch').mockImplementation();
    const reply = jest.fn();
    const adapterHost = { httpAdapter: { reply } } as unknown as HttpAdapterHost;
    const error = new QueryFailedError(
      'SELECT ...',
      [],
      Object.assign(new Error("Invalid object name 'OTRA_TABLA'."), { number: 208 })
    );
    new InvimaDatabaseFilter(adapterHost).catch(error, host);
    expect(fallback).toHaveBeenCalledWith(error, host);
    expect(reply).not.toHaveBeenCalled();
    fallback.mockRestore();
  });
});
