import { Global, Module } from '@nestjs/common';
import { DeferredJobHandlerRegistry, TenantScopeRunner } from './application';
import { DEFERRED_JOB_SCHEDULER } from './domain';
import { SqlDeferredJobScheduler } from './infrastructure';

@Global()
@Module({
  providers: [
    DeferredJobHandlerRegistry,
    TenantScopeRunner,
    SqlDeferredJobScheduler,
    { provide: DEFERRED_JOB_SCHEDULER, useExisting: SqlDeferredJobScheduler },
  ],
  exports: [DEFERRED_JOB_SCHEDULER, DeferredJobHandlerRegistry, TenantScopeRunner],
})
export class DeferredJobsModule {}
