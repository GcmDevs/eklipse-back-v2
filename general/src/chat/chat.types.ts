export interface ChatUser {
  document: string;
  name: string;
}

export interface ChatContact extends ChatUser {
  online: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  sender: ChatUser;
}

export interface ChatConversationSummary {
  id: string;
  contact: ChatContact;
  lastMessage: ChatMessage | null;
  updatedAt: string;
}

export interface ChatConversationDetails {
  conversation: ChatConversationSummary;
  messages: ChatMessage[];
}

export interface ChatBootstrap {
  conversations: ChatConversationSummary[];
}

export interface ChatPresence {
  document: string;
  online: boolean;
}

export interface StartConversationPayload {
  document?: unknown;
}

export interface SearchChatUsersPayload {
  query?: unknown;
}

export interface OpenConversationPayload {
  conversationId?: unknown;
}

export interface SendChatMessagePayload extends OpenConversationPayload {
  content?: unknown;
}

export interface ChatActionAck<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
}

export const normalizeDocument = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';
