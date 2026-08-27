import { createHash } from 'crypto';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { processEnv } from '@env';
import { VALID_HOSTS } from '@gen/app.environments';
import { ChatDirectoryService } from './chat-directory.service';
import { CHAT_EVENTS } from './chat.events';
import { ChatStoreService } from './chat-store.service';
import type {
  ChatActionAck,
  ChatBootstrap,
  ChatContact,
  ChatConversationDetails,
  ChatConversationSummary,
  ChatMessage,
  ChatPresence,
  ChatUser,
  OpenConversationPayload,
  SearchChatUsersPayload,
  SendChatMessagePayload,
  StartConversationPayload,
} from './chat.types';
import { normalizeDocument } from './chat.types';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: VALID_HOSTS },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private static readonly MAX_MESSAGE_LENGTH = 1000;

  @WebSocketServer()
  private server: Namespace;

  private readonly connectedUsers = new Map<string, number>();

  constructor(
    private readonly directory: ChatDirectoryService,
    private readonly store: ChatStoreService,
  ) {}

  afterInit(server: Namespace): void {
    server.use((client, next) => {
      try {
        client.data.chatUser = this.authenticate(client);
        next();
      } catch {
        next(new Error('Tu sesión no es válida. Inicia sesión nuevamente.'));
      }
    });
  }

  handleConnection(client: Socket): void {
    const user = client.data.chatUser as ChatUser;
    client.join(this.userRoom(user.document));
    this.changeConnectionCount(user.document, 1);

    const bootstrap: ChatBootstrap = {
      conversations: this.store.listFor(user.document, (document) => this.isOnline(document)),
    };

    client.emit(CHAT_EVENTS.bootstrap, bootstrap);
    void this.emitPresence(user.document);
  }

  @SubscribeMessage(CHAT_EVENTS.searchUsers)
  async searchUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SearchChatUsersPayload,
  ): Promise<ChatActionAck<ChatContact[]>> {
    const currentUser = client.data.chatUser as ChatUser | undefined;
    if (!currentUser) return this.unauthorized();

    const query = typeof payload?.query === 'string' ? payload.query.trim() : '';
    if (!query) return { ok: true, data: [] };
    if (query.length > 80) {
      return { ok: false, error: 'La búsqueda no puede superar 80 caracteres.' };
    }

    try {
      const contacts = (await this.directory.search(query, currentUser.document))
        .map(user => ({ ...user, online: this.isOnline(user.document) }));

      return { ok: true, data: contacts };
    } catch {
      return {
        ok: false,
        error: 'No fue posible buscar usuarios. Verifica la conexión e intenta nuevamente.',
      };
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.chatUser as ChatUser | undefined;
    if (!user) return;

    this.changeConnectionCount(user.document, -1);
    void this.emitPresence(user.document);
  }

  @SubscribeMessage(CHAT_EVENTS.startConversation)
  async startConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartConversationPayload,
  ): Promise<ChatActionAck<ChatConversationDetails>> {
    const currentUser = client.data.chatUser as ChatUser | undefined;
    if (!currentUser) return this.unauthorized();

    let contact: ChatUser | undefined;
    try {
      contact = await this.directory.findByDocument(payload?.document);
    } catch {
      return {
        ok: false,
        error: 'No fue posible consultar el directorio de usuarios. Intenta nuevamente.',
      };
    }
    if (!contact) return { ok: false, error: 'No encontramos un usuario con ese documento.' };
    if (contact.document === currentUser.document) {
      return { ok: false, error: 'No puedes iniciar una conversación contigo mismo.' };
    }

    const details = this.store.start(currentUser, contact, (document) => this.isOnline(document));
    this.emitConversationUpdate(details.conversation.id);
    return { ok: true, data: details };
  }

  @SubscribeMessage(CHAT_EVENTS.openConversation)
  openConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: OpenConversationPayload,
  ): ChatActionAck<ChatConversationDetails> {
    const currentUser = client.data.chatUser as ChatUser | undefined;
    if (!currentUser) return this.unauthorized();

    const conversationId =
      typeof payload?.conversationId === 'string' ? payload.conversationId.trim() : '';
    if (!conversationId) return { ok: false, error: 'La conversación no es válida.' };

    const details = this.store.open(conversationId, currentUser, (document) =>
      this.isOnline(document),
    );
    if (!details) return { ok: false, error: 'No tienes acceso a esta conversación.' };

    return { ok: true, data: details };
  }

  @SubscribeMessage(CHAT_EVENTS.sendMessage)
  sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendChatMessagePayload,
  ): ChatActionAck<ChatMessage> {
    const currentUser = client.data.chatUser as ChatUser | undefined;
    if (!currentUser) return this.unauthorized();

    const conversationId =
      typeof payload?.conversationId === 'string' ? payload.conversationId.trim() : '';
    const content = typeof payload?.content === 'string' ? payload.content.trim() : '';

    if (!conversationId) return { ok: false, error: 'Selecciona una conversación.' };
    if (!content) return { ok: false, error: 'Escribe un mensaje antes de enviarlo.' };
    if (content.length > ChatGateway.MAX_MESSAGE_LENGTH) {
      return {
        ok: false,
        error: `El mensaje no puede superar ${ChatGateway.MAX_MESSAGE_LENGTH} caracteres.`,
      };
    }

    const message = this.store.addMessage(conversationId, currentUser, content);
    if (!message) return { ok: false, error: 'No tienes acceso a esta conversación.' };

    for (const participant of this.store.participants(conversationId)) {
      this.server.to(this.userRoom(participant.document)).emit(CHAT_EVENTS.message, message);
    }
    this.emitConversationUpdate(conversationId);

    return { ok: true, data: message };
  }

  private authenticate(client: Socket): ChatUser {
    const tokenFromAuth = client.handshake.auth?.token;
    const authorization = client.handshake.headers.authorization;
    const tokenFromHeader = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;
    const token = typeof tokenFromAuth === 'string' ? tokenFromAuth : tokenFromHeader;

    if (!token) throw new Error('Token not found');

    const decoded = (
      processEnv.PRODUCTION ? jwt.verify(token, processEnv.JWT_SECRET_KEY) : jwt.decode(token)
    ) as JwtPayload | null;

    const document = normalizeDocument(decoded?.dcm);
    const name = typeof decoded?.fnm === 'string' ? decoded.fnm.trim() : '';
    if (!decoded?.jti || !decoded?.sub || !document || !name) {
      throw new Error('Invalid token payload');
    }

    return { document, name };
  }

  private emitConversationUpdate(conversationId: string): void {
    for (const participant of this.store.participants(conversationId)) {
      const summary = this.store
        .listFor(participant.document, (document) => this.isOnline(document))
        .find((conversation) => conversation.id === conversationId);
      if (summary) this.emitSummaryToUser(participant.document, summary);
    }
  }

  private emitSummaryToUser(document: string, summary: ChatConversationSummary): void {
    this.server.to(this.userRoom(document)).emit(CHAT_EVENTS.conversationUpdated, summary);
  }

  private async emitPresence(document: string): Promise<void> {
    const presence: ChatPresence = {
      document: normalizeDocument(document),
      online: this.isOnline(document),
    };
    let recipients = this.store.peersFor(document).map(peer => peer.document);

    try {
      if (await this.directory.findByDocument(document)) {
        recipients = [...this.connectedUsers.keys()];
      }
    } catch {
      // Las conversaciones existentes todavía reciben el cambio de presencia.
    }

    for (const recipient of new Set(recipients)) {
      if (recipient !== presence.document) {
        this.server.to(this.userRoom(recipient)).emit(CHAT_EVENTS.presence, presence);
      }
    }
  }

  private isOnline(document: string): boolean {
    return (this.connectedUsers.get(normalizeDocument(document)) ?? 0) > 0;
  }

  private changeConnectionCount(document: string, difference: number): void {
    const normalized = normalizeDocument(document);
    const next = Math.max(0, (this.connectedUsers.get(normalized) ?? 0) + difference);
    if (next === 0) this.connectedUsers.delete(normalized);
    else this.connectedUsers.set(normalized, next);
  }

  private userRoom(document: string): string {
    const digest = createHash('sha256').update(normalizeDocument(document)).digest('hex');
    return `user:${digest}`;
  }

  private unauthorized<T>(): ChatActionAck<T> {
    return { ok: false, error: 'No fue posible identificar tu sesión.' };
  }
}
