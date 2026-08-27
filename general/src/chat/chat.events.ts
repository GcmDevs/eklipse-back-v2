export const CHAT_EVENTS = {
  bootstrap: 'chat:bootstrap',
  conversationUpdated: 'chat:conversation:updated',
  message: 'chat:message:new',
  presence: 'chat:contact:presence',
  searchUsers: 'chat:users:search',
  startConversation: 'chat:conversation:start',
  openConversation: 'chat:conversation:open',
  sendMessage: 'chat:message:send',
} as const;
