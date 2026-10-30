import { assertTenantCtxHeaderAllowedAsync } from '@common/infrastructure/persistence/transactional/tenant-ctx-access.helper';
import { TenantOverrideContext } from '@common/infrastructure/persistence/transactional/tenant-override-context';
import { extractTenantContext } from '@common/presentation/decorators/header-context.decorator';
import { TENANT_CTX_AUTHORITY_KEY } from '@common/presentation/decorators/tenant-ctx-authority.decorator';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, Observable, Subscriber, Subscription, switchMap } from 'rxjs';

@Injectable()
export class TenantOverrideInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const tenant = extractTenantContext(context.switchToHttp().getRequest());
    if (!tenant) {
      return next.handle();
    }

    const requiredAuthority = this.reflector.get<string | undefined>(
      TENANT_CTX_AUTHORITY_KEY,
      context.getHandler()
    );

    return from(assertTenantCtxHeaderAllowedAsync(tenant, requiredAuthority)).pipe(
      switchMap(() => this.runWithOverride(tenant, next))
    );
  }

  private runWithOverride(tenant: import('@common/domain/types').GcmContextType, next: CallHandler) {
    return new Observable((subscriber: Subscriber<unknown>) => {
      let inner: Subscription | undefined;

      TenantOverrideContext.run(tenant, () => {
        return new Promise<void>((resolve, reject) => {
          inner = next.handle().subscribe({
            next: value => subscriber.next(value),
            error: err => {
              subscriber.error(err);
              reject(err);
            },
            complete: () => {
              subscriber.complete();
              resolve();
            },
          });
        });
      }).catch(err => {
        if (!subscriber.closed) {
          subscriber.error(err);
        }
      });

      return () => inner?.unsubscribe();
    });
  }
}
