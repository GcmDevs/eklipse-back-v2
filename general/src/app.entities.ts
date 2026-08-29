import { ORM_SECURITY_ENTITIES } from '@gen/security/infrastructure/orm';
import { CHAT_ENTITIES } from './chat/orm';

export const ENTITIES = [
  // --- AVOID NOWRAP --- //
  ...ORM_SECURITY_ENTITIES,
  ...CHAT_ENTITIES,
];
