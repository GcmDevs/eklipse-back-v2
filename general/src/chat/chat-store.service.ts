import { createHash, randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type {
  ChatConversationDetails,
  ChatConversationSummary,
  ChatMessage,
  ChatUser,
} from './chat.types';
import { normalizeDocument } from './chat.types';

interface StoredConversation {
  id: string;
  participants: [ChatUser, ChatUser];
  messages: ChatMessage[];
  updatedAt: string;
}

@Injectable()
export class ChatStoreService {
  private static readonly MAX_MESSAGES = 500;
  private readonly conversations = new Map<string, StoredConversation>();

  start(
    currentUser: ChatUser,
    contact: ChatUser,
    isOnline: (document: string) => boolean,
  ): ChatConversationDetails {
    const id = this.createConversationId(currentUser.document, contact.document);
    let stored = this.conversations.get(id);

    if (!stored) {
      stored = {
        id,
        participants: [this.copyUser(currentUser), this.copyUser(contact)],
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      this.conversations.set(id, stored);
    } else {
      this.refreshParticipant(stored, currentUser);
      this.refreshParticipant(stored, contact);
    }

    return this.detailsFor(stored, currentUser.document, isOnline);
  }

  open(
    conversationId: string,
    currentUser: ChatUser,
    isOnline: (document: string) => boolean,
  ): ChatConversationDetails | undefined {
    const stored = this.conversations.get(conversationId);
    if (!stored || !this.hasParticipant(stored, currentUser.document)) return undefined;

    this.refreshParticipant(stored, currentUser);
    return this.detailsFor(stored, currentUser.document, isOnline);
  }

  addMessage(
    conversationId: string,
    currentUser: ChatUser,
    content: string,
  ): ChatMessage | undefined {
    const stored = this.conversations.get(conversationId);
    if (!stored || !this.hasParticipant(stored, currentUser.document)) return undefined;

    this.refreshParticipant(stored, currentUser);
    const message: ChatMessage = {
      id: randomUUID(),
      conversationId,
      content,
      createdAt: new Date().toISOString(),
      sender: this.copyUser(currentUser),
    };

    stored.messages = [...stored.messages, message].slice(-ChatStoreService.MAX_MESSAGES);
    stored.updatedAt = message.createdAt;
    return { ...message, sender: this.copyUser(message.sender) };
  }

  listFor(
    document: string,
    isOnline: (contactDocument: string) => boolean,
  ): ChatConversationSummary[] {
    return [...this.conversations.values()]
      .filter((stored) => this.hasParticipant(stored, document))
      .map((stored) => this.summaryFor(stored, document, isOnline))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  participants(conversationId: string): ChatUser[] {
    return (this.conversations.get(conversationId)?.participants ?? []).map((user) =>
      this.copyUser(user),
    );
  }

  peersFor(document: string): ChatUser[] {
    const normalized = normalizeDocument(document);
    const peers = new Map<string, ChatUser>();

    for (const conversation of this.conversations.values()) {
      if (!this.hasParticipant(conversation, normalized)) continue;
      for (const participant of conversation.participants) {
        if (participant.document !== normalized) {
          peers.set(participant.document, this.copyUser(participant));
        }
      }
    }

    return [...peers.values()];
  }

  private detailsFor(
    stored: StoredConversation,
    document: string,
    isOnline: (contactDocument: string) => boolean,
  ): ChatConversationDetails {
    return {
      conversation: this.summaryFor(stored, document, isOnline),
      messages: stored.messages.map((message) => ({
        ...message,
        sender: this.copyUser(message.sender),
      })),
    };
  }

  private summaryFor(
    stored: StoredConversation,
    document: string,
    isOnline: (contactDocument: string) => boolean,
  ): ChatConversationSummary {
    const normalized = normalizeDocument(document);
    const contact = stored.participants.find((participant) => participant.document !== normalized);

    if (!contact) throw new Error('Conversation without a contact');

    const lastMessage = stored.messages.at(-1);
    return {
      id: stored.id,
      contact: { ...this.copyUser(contact), online: isOnline(contact.document) },
      lastMessage: lastMessage
        ? { ...lastMessage, sender: this.copyUser(lastMessage.sender) }
        : null,
      updatedAt: stored.updatedAt,
    };
  }

  private refreshParticipant(stored: StoredConversation, user: ChatUser): void {
    const normalized = normalizeDocument(user.document);
    const index = stored.participants.findIndex((participant) => participant.document === normalized);
    if (index >= 0) stored.participants[index] = this.copyUser(user);
  }

  private hasParticipant(stored: StoredConversation, document: string): boolean {
    const normalized = normalizeDocument(document);
    return stored.participants.some((participant) => participant.document === normalized);
  }

  private createConversationId(firstDocument: string, secondDocument: string): string {
    const pair = [normalizeDocument(firstDocument), normalizeDocument(secondDocument)]
      .sort()
      .join(':');
    return createHash('sha256').update(pair).digest('hex').slice(0, 24);
  }

  private copyUser(user: ChatUser): ChatUser {
    return {
      document: normalizeDocument(user.document),
      name: user.name.trim(),
    };
  }
}
