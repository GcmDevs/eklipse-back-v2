export const CHAT_EVENTS = {
  bootstrap: 'chat:bootstrap',
  conversationUpdated: 'chat:conversation:updated',
  message: 'chat:message:new',
  presence: 'chat:contact:presence',
  onlineUsersCount: 'chat:users:online-count',
  searchUsers: 'chat:users:search',
  startConversation: 'chat:conversation:start',
  openConversation: 'chat:conversation:open',
  markConversationRead: 'chat:conversation:read',
  loadPreviousMessages: 'chat:messages:previous',
  sendMessage: 'chat:message:send',
} as const;
