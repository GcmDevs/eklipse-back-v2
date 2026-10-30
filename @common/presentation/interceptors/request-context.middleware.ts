import { BaseSource, RequestContext, RequestContextData } from '@common/infrastructure/services';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware  {
  use(req: Request, res: Response, next: NextFunction) {
    const ctx: RequestContextData = {};
    RequestContext.run(ctx, () => next());
  }
}