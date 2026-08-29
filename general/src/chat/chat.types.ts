export interface ChatUser {
  document: string;
  name: string;
}

export interface RegisteredChatUser extends ChatUser {
  id: number;
}

export interface ChatContact extends ChatUser {
  online: boolean;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  content: string;
  attachments: string[];
  createdAt: string;
  sender: ChatUser;
}

export interface ChatConversationSummary {
  id: number;
  contact: ChatContact;
  lastMessage: ChatMessage | null;
  lastReadMessageId: number | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatMessagePage {
  messages: ChatMessage[];
  hasMoreMessages: boolean;
}

export interface ChatConversationDetails extends ChatMessagePage {
  conversation: ChatConversationSummary;
}

export interface ChatBootstrap {
  conversations: ChatConversationSummary[];
  onlineUsersCount?: number;
  notifications: ChatNotificationState;
  security: ChatSecurityState;
}

export interface ChatNotificationState {
  unreadCount: number;
}

export interface ChatSecurityState {
  enabled: boolean;
  locked: boolean;
  lockAfterMinutes: number;
}

export interface ChatSecurityUnlockDetails {
  security: ChatSecurityState;
  bootstrap: ChatBootstrap;
}

export interface ChatPresence {
  document: string;
  online: boolean;
}

export interface ChatOnlineUsersCount {
  count: number;
}

export interface StartConversationPayload {
  document?: unknown;
}

export interface SearchChatUsersPayload {
  query?: unknown;
}

export interface OpenConversationPayload {
  conversationId?: number | undefined;
  markAsRead?: unknown;
}

export interface LoadPreviousChatMessagesPayload extends OpenConversationPayload {
  beforeMessageId?: number | undefined;
}

export interface SendChatMessagePayload extends OpenConversationPayload {
  content?: unknown;
  attachments?: unknown;
}

export interface ChatPinPayload {
  pin?: unknown;
}

export interface ChatActionAck<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
  cleanupAttachments?: boolean;
  requiresPin?: boolean;
  retryAfterSeconds?: number;
}

export const normalizeDocument = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';
