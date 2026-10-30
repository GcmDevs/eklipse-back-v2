import { BadInputError } from '@common/domain/errors';
import { DomainError } from '@common/domain/errors/domain-error';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { handleDatabaseExceptions } from '../factories/database-exception.factory';
import { throwDomainError } from '../factories/domain-error.factory';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    let httpException: HttpException;

    if (exception instanceof DomainError) {
      httpException = throwDomainError(exception);
    } else if (exception instanceof HttpException) {
      httpException = exception;
    } else if (exception instanceof QueryFailedError) {
      httpException = handleDatabaseExceptions(
        (exception as QueryFailedError & { driverError?: unknown }).driverError ?? exception
      );
    } else {
      httpException = new InternalServerErrorException(exception || 'Error interno del servidor');
    }

    const status = httpException.getStatus();
    const message: any = httpException.getResponse();

    const errorMessage = Array.isArray(message?.message)
      ? message.message.join(', ')
      : message?.message ?? message ?? 'Algo salió mal';

    const body: Record<string, unknown> = {
      status: false,
      statusCode: status,
      message: typeof errorMessage === 'string' ? errorMessage : errorMessage,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof BadInputError) {
      if (exception.businessCode) body.code = exception.businessCode;
      if (exception.details) body.details = exception.details;
    } else if (status === 400 && message && typeof message === 'object' && !Array.isArray(message)) {
      if (message.code) body.code = message.code;
      if (message.details) body.details = message.details;
    }

    response.status(status).json(body);
  }
}
