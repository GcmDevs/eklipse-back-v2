import { ConsecutivosModule } from "./consecutivos/consecutivos.module";
import { DeferredJobsModule } from "./deferred-jobs/deferred-jobs.module";
import { IdempotencyModule } from "./idempotency/idempotency.module";
import { IdentityModule } from './identity/identity.module';
import { GenModule } from "./gen/gen.module";
import { MediaModule } from "./media/media.module";
import { TercerosModule } from "./terceros/tercero.module";

export const COR_MODULES = [
    IdentityModule, TercerosModule, ConsecutivosModule, IdempotencyModule, MediaModule, GenModule,
    DeferredJobsModule
]
