import { createHash } from 'crypto';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { Logger } from '@nestjs/common';
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
  ChatMessagePage,
  ChatPresence,
  ChatUser,
  LoadPreviousChatMessagesPayload,
  OpenConversationPayload,
  RegisteredChatUser,
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
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private server: Namespace;

  private readonly connectedUsers = new Map<string, number>();

  constructor(
    private readonly directory: ChatDirectoryService,
    private readonly store: ChatStoreService
  ) {}

  afterInit(server: Namespace): void {
    server.use(async (client, next) => {
      let tokenUser: ChatUser;
      try {
        tokenUser = this.authenticate(client);
      } catch {
        next(new Error('Tu sesión no es válida. Inicia sesión nuevamente.'));
        return;
      }

      try {
        const registeredUser = await this.directory.findByDocument(tokenUser.document);
        if (!registeredUser) {
          next(new Error('Tu usuario no está registrado para utilizar el chat.'));
          return;
        }

        client.data.chatUser = registeredUser;
        next();
      } catch {
        next(new Error('No fue posible validar tu acceso al chat. Intenta nuevamente.'));
      }
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const user = client.data.chatUser as RegisteredChatUser;
    client.join(this.userRoom(user.document));
    this.changeConnectionCount(user.document, 1);

    let conversations: ChatConversationSummary[] = [];
    try {
      conversations = await this.store.listFor(user.id, document => this.isOnline(document));
    } catch (error) {
      this.logPersistenceError('cargar conversaciones', error);
      client.emit('exception', {
        message: 'No fue posible cargar tus conversaciones guardadas.',
      });
    }

    const bootstrap: ChatBootstrap = { conversations };
    client.emit(CHAT_EVENTS.bootstrap, bootstrap);
    void this.emitPresence(user);
  }

  @SubscribeMessage(CHAT_EVENTS.searchUsers)
  async searchUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SearchChatUsersPayload
  ): Promise<ChatActionAck<ChatContact[]>> {
    const currentUser = client.data.chatUser as RegisteredChatUser | undefined;
    if (!currentUser) return this.unauthorized();

    const query = typeof payload?.query === 'string' ? payload.query.trim() : '';
    if (!query) return { ok: true, data: [] };
    if (query.length > 80) {
      return { ok: false, error: 'La búsqueda no puede superar 80 caracteres.' };
    }

    try {
      const contacts = (await this.directory.search(query, currentUser.document)).map(user => ({
        document: user.document,
        name: user.name,
        online: this.isOnline(user.document),
      }));

      return { ok: true, data: contacts };
    } catch {
      return {
        ok: false,
        error: 'No fue posible buscar usuarios. Verifica la conexión e intenta nuevamente.',
      };
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.chatUser as RegisteredChatUser | undefined;
    if (!user) return;

    this.changeConnectionCount(user.document, -1);
    void this.emitPresence(user);
  }

  @SubscribeMessage(CHAT_EVENTS.startConversation)
  async startConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartConversationPayload
  ): Promise<ChatActionAck<ChatConversationDetails>> {
    const currentUser = client.data.chatUser as RegisteredChatUser | undefined;
    if (!currentUser) return this.unauthorized();

    let registeredCurrentUser: RegisteredChatUser | undefined;
    let contact: RegisteredChatUser | undefined;
    try {
      [registeredCurrentUser, contact] = await Promise.all([
        this.directory.findByDocument(currentUser.document),
        this.directory.findByDocument(payload?.document),
      ]);
    } catch {
      return {
        ok: false,
        error: 'No fue posible consultar el directorio de usuarios. Intenta nuevamente.',
      };
    }
    if (!registeredCurrentUser || registeredCurrentUser.id !== currentUser.id) {
      return { ok: false, error: 'Tu usuario ya no está registrado para utilizar el chat.' };
    }
    if (!contact) return { ok: false, error: 'No encontramos un usuario con ese documento.' };
    if (contact.id === registeredCurrentUser.id) {
      return { ok: false, error: 'No puedes iniciar una conversación contigo mismo.' };
    }

    try {
      const details = await this.store.start(registeredCurrentUser, contact, document =>
        this.isOnline(document)
      );
      void this.emitConversationUpdate(details.conversation.id);
      return { ok: true, data: details };
    } catch (error) {
      this.logPersistenceError('crear una conversación', error);
      return { ok: false, error: 'No fue posible guardar la conversación.' };
    }
  }

  @SubscribeMessage(CHAT_EVENTS.openConversation)
  async openConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: OpenConversationPayload
  ): Promise<ChatActionAck<ChatConversationDetails>> {
    const currentUser = client.data.chatUser as RegisteredChatUser | undefined;
    if (!currentUser) return this.unauthorized();

    if (!payload.conversationId) return { ok: false, error: 'La conversación no es válida.' };

    try {
      const details = await this.store.open(payload.conversationId, currentUser, document =>
        this.isOnline(document)
      );
      if (!details) return { ok: false, error: 'No tienes acceso a esta conversación.' };

      return { ok: true, data: details };
    } catch (error) {
      this.logPersistenceError('abrir una conversación', error);
      return { ok: false, error: 'No fue posible cargar los mensajes guardados.' };
    }
  }

  @SubscribeMessage(CHAT_EVENTS.loadPreviousMessages)
  async loadPreviousMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LoadPreviousChatMessagesPayload
  ): Promise<ChatActionAck<ChatMessagePage>> {
    const currentUser = client.data.chatUser as RegisteredChatUser | undefined;
    if (!currentUser) return this.unauthorized();

    const conversationId = payload?.conversationId;
    const beforeMessageId = payload?.beforeMessageId;
    if (
      !Number.isSafeInteger(conversationId) ||
      Number(conversationId) <= 0 ||
      !Number.isSafeInteger(beforeMessageId) ||
      Number(beforeMessageId) <= 0
    ) {
      return { ok: false, error: 'No fue posible identificar los mensajes anteriores.' };
    }

    try {
      const page = await this.store.loadPreviousMessages(
        Number(conversationId),
        currentUser,
        Number(beforeMessageId)
      );
      if (!page) return { ok: false, error: 'No tienes acceso a esta conversación.' };

      return { ok: true, data: page };
    } catch (error) {
      this.logPersistenceError('cargar mensajes anteriores', error);
      return { ok: false, error: 'No fue posible cargar los mensajes anteriores.' };
    }
  }

  @SubscribeMessage(CHAT_EVENTS.sendMessage)
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendChatMessagePayload
  ): Promise<ChatActionAck<ChatMessage>> {
    const currentUser = client.data.chatUser as RegisteredChatUser | undefined;
    if (!currentUser) return this.unauthorized();

    const content = typeof payload?.content === 'string' ? payload.content.trim() : '';

    if (!payload.conversationId) return { ok: false, error: 'Selecciona una conversación.' };
    if (!content) return { ok: false, error: 'Escribe un mensaje antes de enviarlo.' };
    if (content.length > ChatGateway.MAX_MESSAGE_LENGTH) {
      return {
        ok: false,
        error: `El mensaje no puede superar ${ChatGateway.MAX_MESSAGE_LENGTH} caracteres.`,
      };
    }

    try {
      const participants = await this.store.participants(payload.conversationId);
      if (!participants.some(participant => participant.id === currentUser.id)) {
        return { ok: false, error: 'No tienes acceso a esta conversación.' };
      }

      const registeredParticipants = await this.directory.findByIds(
        participants.map(participant => participant.id)
      );
      if (registeredParticipants.length !== 2) {
        return {
          ok: false,
          error: 'No se puede enviar el mensaje porque uno de los usuarios ya no está registrado.',
        };
      }

      const registeredCurrentUser = registeredParticipants.find(
        participant => participant.id === currentUser.id
      );
      if (!registeredCurrentUser || registeredCurrentUser.document !== currentUser.document) {
        return { ok: false, error: 'Tu usuario ya no está registrado para utilizar el chat.' };
      }

      const message = await this.store.addMessage(
        payload.conversationId,
        registeredCurrentUser,
        content
      );
      if (!message) return { ok: false, error: 'No tienes acceso a esta conversación.' };

      for (const participant of registeredParticipants) {
        this.server.to(this.userRoom(participant.document)).emit(CHAT_EVENTS.message, message);
      }
      void this.emitConversationUpdate(payload.conversationId);

      return { ok: true, data: message };
    } catch (error) {
      this.logPersistenceError('guardar un mensaje', error);
      return { ok: false, error: 'No fue posible guardar el mensaje. Intenta nuevamente.' };
    }
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

  private async emitConversationUpdate(conversationId: number): Promise<void> {
    try {
      const participants = await this.store.participants(conversationId);
      await Promise.all(
        participants.map(async participant => {
          const summary = (
            await this.store.listFor(participant.id, document => this.isOnline(document))
          ).find(conversation => conversation.id === conversationId);
          if (summary) this.emitSummaryToUser(participant.document, summary);
        })
      );
    } catch {
      // El mensaje ya quedó persistido; la bandeja se recuperará al reconectar.
    }
  }

  private emitSummaryToUser(document: string, summary: ChatConversationSummary): void {
    this.server.to(this.userRoom(document)).emit(CHAT_EVENTS.conversationUpdated, summary);
  }

  private async emitPresence(user: RegisteredChatUser): Promise<void> {
    const presence: ChatPresence = {
      document: normalizeDocument(user.document),
      online: this.isOnline(user.document),
    };
    let recipients: string[] = [];

    try {
      recipients = (await this.store.peersFor(user.id)).map(peer => peer.document);
      if ((await this.directory.findByIds([user.id])).length === 1) {
        recipients = [...this.connectedUsers.keys()];
      }
    } catch {
      // La presencia se recuperará en la próxima conexión satisfactoria.
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

  private logPersistenceError(action: string, error: unknown): void {
    const trace = error instanceof Error ? error.stack : String(error);
    this.logger.error(`Error al ${action} del chat`, trace);
  }
}
