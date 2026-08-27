import { ORM_SECURITY_ENTITIES } from '@gen/security/infrastructure/orm';
import { ChatConversationOrm } from '@gen/chat/chat-conversation.orm';
import { ChatMessageOrm } from '@gen/chat/chat-message.orm';
import { ChatUserOrm } from '@gen/chat/chat-user.orm';

export const ENTITIES = [
  // --- AVOID NOWRAP --- //
  ...ORM_SECURITY_ENTITIES,
  ChatConversationOrm,
  ChatMessageOrm,
  ChatUserOrm,
];
