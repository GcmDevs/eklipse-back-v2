import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class InvimaDatabaseFilter extends BaseExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const driver = exception.driverError as Error & {
      number?: number;
      originalError?: { info?: { number?: number } };
    };
    const number = driver.number ?? driver.originalError?.info?.number;
    if (
      number !== 208 ||
      !/\bEKINNIV(?:PRODUCTO|VERIFICACION|CONFIRMACION|FACTURA|FACTURAITEM)\b/i.test(driver.message)
    ) {
      super.catch(exception, host);
      return;
    }

    // Missing installation is different from a successfully queried empty list.
    this.adapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      {
        statusCode: 503,
        error: 'Servicio no disponible',
        code: 'INVIMA_MIGRACION_PENDIENTE',
        message:
          'Faltan tablas de INVIMA en la base activa. Revise la conexión y aplique las migraciones 20261020_invima.sql y 20261020_invima_facturas.sql en esa base. Si cambió .env, reinicie el backend.',
      },
      503
    );
  }
}
