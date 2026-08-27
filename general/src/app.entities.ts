import { ORM_SECURITY_ENTITIES } from '@gen/security/infrastructure/orm';
import { ChatUserOrm } from '@gen/chat/chat-user.orm';

export const ENTITIES = [
  // --- AVOID NOWRAP --- //
  ...ORM_SECURITY_ENTITIES,
  ChatUserOrm,
];
