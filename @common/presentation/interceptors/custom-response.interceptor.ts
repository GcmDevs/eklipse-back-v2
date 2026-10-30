import { KEYS } from '@common/application/constants';
import { FormatResponse } from '@common/domain/types';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';

@Injectable()
export class CustomResponseInterceptor<T> implements NestInterceptor {
  constructor(private readonly reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<FormatResponse<T>> {
    const fileResponse = this.reflector.getAllAndOverride(KEYS.FILE_RESPONSE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (fileResponse) return next.handle() as Observable<any>;
    
    return next.handle().pipe(map((res: unknown) => this.responseHandler(res, context)));
  }

  responseHandler(res: any, context: ExecutionContext): FormatResponse<T> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const statusCode = response.statusCode;
    const metadata = res.metadata;

    return {
      status: true,
      statusCode,
      message: res.message,
      data: res.data,
      metadata: metadata,
      timestamp: new Date().toISOString(),
    };
  }
}
