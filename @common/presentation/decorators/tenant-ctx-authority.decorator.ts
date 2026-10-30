import { SetMetadata } from '@nestjs/common';

export const TENANT_CTX_AUTHORITY_KEY = 'tenant_ctx_authority';

export function RequireTenantCtxAuthority(authority: string): MethodDecorator {
  return SetMetadata(TENANT_CTX_AUTHORITY_KEY, authority);
}
