import { Injectable } from '@nestjs/common';
import { LessThan } from 'typeorm';
import { GCM_CONTEXTS } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { ChatConversationOrm } from './orm/conversation.orm';
import { ChatMessageOrm } from './orm/message.orm';
import type {
  ChatConversationDetails,
  ChatConversationSummary,
  ChatMessage,
  ChatMessagePage,
  ChatUser,
  RegisteredChatUser,
} from './chat.types';
import { normalizeDocument } from './chat.types';

@Injectable()
export class ChatStoreService {
  private static readonly MESSAGES_PAGE_SIZE = 30;
  private readonly sharedConn = switchConn(GCM_CONTEXTS.EKLIPSE);

  async start(
    currentUser: RegisteredChatUser,
    contact: RegisteredChatUser,
    isOnline: (document: string) => boolean
  ): Promise<ChatConversationDetails> {
    const [firstUser, secondUser] = [currentUser, contact].sort(
      (left, right) => left.id - right.id
    );
    const conversationId = await this.sharedConn.transaction('SERIALIZABLE', async manager => {
      const repository = manager.getRepository(ChatConversationOrm);
      const existing = await repository.findOne({
        where: { firstUserId: firstUser.id, secondUserId: secondUser.id },
      });
      if (existing) return existing.id;

      const now = new Date();
      const saved = await repository.save(
        repository.create({
          firstUserId: firstUser.id,
          secondUserId: secondUser.id,
          createdAt: now,
          updatedAt: now,
        })
      );
      return saved.id;
    });
    const conversation = await this.findConversationById(conversationId);

    if (!conversation) throw new Error('Conversation was not persisted');
    return this.detailsFor(conversation, currentUser.id, isOnline);
  }

  async open(
    conversationId: number,
    currentUser: RegisteredChatUser,
    isOnline: (document: string) => boolean
  ): Promise<ChatConversationDetails | undefined> {
    const conversation = await this.findConversationById(conversationId);
    if (!conversation || !this.hasParticipant(conversation, currentUser.id)) return undefined;
    return this.detailsFor(conversation, currentUser.id, isOnline);
  }

  async loadPreviousMessages(
    conversationId: number,
    currentUser: RegisteredChatUser,
    beforeMessageId: number
  ): Promise<ChatMessagePage | undefined> {
    const conversation = await this.findConversationById(conversationId);
    if (!conversation || !this.hasParticipant(conversation, currentUser.id)) return undefined;

    return this.messagePage(conversationId, beforeMessageId);
  }

  async addMessage(
    conversationId: number,
    currentUser: RegisteredChatUser,
    content: string
  ): Promise<ChatMessage | undefined> {
    return this.sharedConn.transaction(async manager => {
      const conversationRepository = manager.getRepository(ChatConversationOrm);
      const messageRepository = manager.getRepository(ChatMessageOrm);
      const conversation = await conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['firstUser', 'secondUser'],
      });
      if (!conversation || !this.hasParticipant(conversation, currentUser.id)) return undefined;

      const recipient = this.otherParticipant(conversation, currentUser.id);
      if (!recipient) return undefined;

      const createdAt = new Date();
      const message = await messageRepository.save(
        messageRepository.create({
          conversationId,
          senderUserId: currentUser.id,
          recipientUserId: recipient.id,
          content,
          createdAt,
        })
      );

      conversation.lastMessageId = message.id;
      conversation.lastSenderUserId = currentUser.id;
      conversation.updatedAt = createdAt;
      await conversationRepository.save(conversation);

      return this.toChatMessage(message, currentUser);
    });
  }

  async listFor(
    userId: number,
    isOnline: (contactDocument: string) => boolean
  ): Promise<ChatConversationSummary[]> {
    const conversations = await this.sharedConn.getRepository(ChatConversationOrm).find({
      where: [{ firstUserId: userId }, { secondUserId: userId }],
      relations: ['firstUser', 'secondUser', 'lastMessage', 'lastSenderUser'],
      order: { updatedAt: 'DESC' },
    });

    return conversations.map(conversation => this.summaryFor(conversation, userId, isOnline));
  }

  async participants(conversationId: number): Promise<RegisteredChatUser[]> {
    const conversation = await this.sharedConn.getRepository(ChatConversationOrm).findOne({
      where: { id: conversationId },
      relations: ['firstUser', 'secondUser'],
    });
    return conversation ? this.participantsFrom(conversation) : [];
  }

  async peersFor(userId: number): Promise<RegisteredChatUser[]> {
    const conversations = await this.sharedConn.getRepository(ChatConversationOrm).find({
      where: [{ firstUserId: userId }, { secondUserId: userId }],
      relations: ['firstUser', 'secondUser'],
    });
    const peers = new Map<number, RegisteredChatUser>();

    for (const conversation of conversations) {
      const peer = this.otherParticipant(conversation, userId);
      if (peer) peers.set(peer.id, peer);
    }

    return [...peers.values()];
  }

  private async detailsFor(
    conversation: ChatConversationOrm,
    userId: number,
    isOnline: (contactDocument: string) => boolean
  ): Promise<ChatConversationDetails> {
    const messagePage = await this.messagePage(conversation.id);

    return {
      conversation: this.summaryFor(conversation, userId, isOnline),
      ...messagePage,
    };
  }

  private async messagePage(
    conversationId: number,
    beforeMessageId?: number
  ): Promise<ChatMessagePage> {
    const where = beforeMessageId
      ? { conversationId, id: LessThan(beforeMessageId) }
      : { conversationId };
    const persistedMessages = await this.sharedConn.getRepository(ChatMessageOrm).find({
      where,
      relations: ['senderUser'],
      order: { id: 'DESC' },
      take: ChatStoreService.MESSAGES_PAGE_SIZE + 1,
    });
    const hasMoreMessages = persistedMessages.length > ChatStoreService.MESSAGES_PAGE_SIZE;
    const messages = persistedMessages.slice(0, ChatStoreService.MESSAGES_PAGE_SIZE);

    return {
      messages: messages.reverse().map(message => this.toChatMessage(message)),
      hasMoreMessages,
    };
  }

  private summaryFor(
    conversation: ChatConversationOrm,
    userId: number,
    isOnline: (contactDocument: string) => boolean
  ): ChatConversationSummary {
    const contact = this.otherParticipant(conversation, userId);
    if (!contact) throw new Error('Conversation without a contact');

    const lastMessage =
      conversation.lastMessageId && conversation.lastMessage && conversation.lastSenderUser
        ? {
            id: conversation.lastMessageId,
            conversationId: conversation.id,
            content: conversation.lastMessage.content,
            createdAt: this.toIsoString(conversation.lastMessage.createdAt),
            sender: this.toChatUser(conversation.lastSenderUser),
          }
        : null;

    return {
      id: conversation.id,
      contact: {
        document: contact.document,
        name: contact.name,
        online: isOnline(contact.document),
      },
      lastMessage,
      updatedAt: this.toIsoString(conversation.updatedAt),
    };
  }

  private participantsFrom(conversation: ChatConversationOrm): RegisteredChatUser[] {
    if (!conversation.firstUser || !conversation.secondUser) {
      throw new Error('Conversation users were not loaded');
    }

    return [
      this.toRegisteredChatUser(conversation.firstUser),
      this.toRegisteredChatUser(conversation.secondUser),
    ];
  }

  private otherParticipant(
    conversation: ChatConversationOrm,
    userId: number
  ): RegisteredChatUser | undefined {
    const participants = this.participantsFrom(conversation);
    if (conversation.firstUserId === userId) return participants[1];
    if (conversation.secondUserId === userId) return participants[0];
    return undefined;
  }

  private hasParticipant(conversation: ChatConversationOrm, userId: number): boolean {
    return conversation.firstUserId === userId || conversation.secondUserId === userId;
  }

  private findConversationById(id: number): Promise<ChatConversationOrm | null> {
    return this.sharedConn.getRepository(ChatConversationOrm).findOne({
      where: { id },
      relations: ['firstUser', 'secondUser', 'lastMessage', 'lastSenderUser'],
    });
  }

  private toRegisteredChatUser(user: {
    id: number;
    document: string;
    fullName: string;
  }): RegisteredChatUser {
    return {
      id: Number(user.id),
      document: normalizeDocument(String(user.document ?? '')),
      name: String(user.fullName ?? '').trim(),
    };
  }

  private toChatUser(user: { document: string; fullName: string }): ChatUser {
    return {
      document: normalizeDocument(String(user.document ?? '')),
      name: String(user.fullName ?? '').trim(),
    };
  }

  private toChatMessage(message: ChatMessageOrm, sender?: RegisteredChatUser): ChatMessage {
    const publicSender = sender
      ? { document: sender.document, name: sender.name }
      : this.toChatUser(message.senderUser);

    return {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      createdAt: this.toIsoString(message.createdAt),
      sender: publicSender,
    };
  }

  private toIsoString(value: Date): string {
    return new Date(value).toISOString();
  }
}
