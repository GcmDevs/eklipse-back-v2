import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { processEnv } from '@env';
import { JWTServices } from '@common/application/services';
import { VALID_HOSTS } from '@hpn/app.environments';
import { GcmContextCode } from '@common/domain/types';
import { EstadoAsistenciaTypeCode } from '../../@types/gcn';
import { fetchAuthsByUser } from '@common/infrastructure/services/authorities';
import { resolveTrasladosSocketAccess, TrasladosSocketAccess } from './traslados-realtime-policy';

export interface TrasladoRealtimeEvent {
  tipo: EstadoAsistenciaTypeCode;
  trasladoId: number;
  contextoCode: GcmContextCode;
  ocurridoEn: string;
}

@WebSocketGateway({
  namespace: '/traslados-asistenciales',
  cors: { origin: VALID_HOSTS, methods: ['GET', 'POST'] },
})
export class TrasladosRealtimeGateway {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(TrasladosRealtimeGateway.name);
  private readonly roomOperations = new WeakMap<Socket, Promise<unknown>>();

  public afterInit(server: Namespace): void {
    // Socket.IO termina la autorización antes de aceptar mensajes de suscripción.
    server.use((client, next) => {
      void this.authorize(client)
        .then(() => next())
        .catch(() => {
          this.logger.warn('Conexión de traslados rechazada por autenticación o permisos');
          next(new Error('No autorizado para recibir eventos de traslados'));
        });
    });
  }

  private async authorize(client: Socket): Promise<void> {
    const token = this.getToken(client.handshake.auth?.token);
    if (processEnv.PRODUCTION) jwt.verify(token, processEnv.JWT_SECRET_KEY);

    const auth = JWTServices.decodeToken(token);
    if (auth.passWasReset || !auth.user.document?.trim()) throw new Error('Sesión no habilitada');
    const { onlyCodes } = await fetchAuthsByUser({ tk: token });
    const access = resolveTrasladosSocketAccess(auth.context.getCode(), onlyCodes);
    if (!access) throw new Error('Sin permisos de traslados');
    client.data.trasladosAccess = access;
    client.data.documento = auth.user.document;
    client.data.contextoCode = auth.context.getCode();
  }

  public handleConnection(client: Socket): void {
    const access: TrasladosSocketAccess | undefined = client.data.trasladosAccess;
    if (!access) {
      client.disconnect(true);
      return;
    }
    const ready = Promise.resolve(
      access.personal ? client.join(this.userRoom(client.data.documento)) : undefined
    );
    this.roomOperations.set(client, ready);
    void ready.catch(() => client.disconnect(true));
  }

  @SubscribeMessage('traslado:configurar-contextos')
  public configureContexts(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { contextos: GcmContextCode[] }
  ) {
    return this.configureRooms(client, body?.contextos, false);
  }

  @SubscribeMessage('traslado:suscribir-contexto')
  public subscribeContext(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { contextoCode: GcmContextCode }
  ) {
    return this.configureRooms(client, [body?.contextoCode], true);
  }

  private configureRooms(
    client: Socket,
    requested: GcmContextCode[],
    append: boolean
  ): Promise<{ ok: boolean }> {
    const operation = (this.roomOperations.get(client) ?? Promise.resolve())
      .then(async () => {
        const access: TrasladosSocketAccess | undefined = client.data.trasladosAccess;
        if (
          !client.connected ||
          !access ||
          !Array.isArray(requested) ||
          requested.some(ctx => !access.contextos.includes(ctx))
        )
          return { ok: false };
        const previous: GcmContextCode[] = client.data.trasladoContextos ?? [];
        const contexts = [...new Set(append ? [...previous, ...requested] : requested)];
        await Promise.all(
          previous
            .filter(ctx => !contexts.includes(ctx))
            .map(ctx => client.leave(this.contextRoom(ctx)))
        );
        if (!client.connected) return { ok: false };
        await Promise.all(contexts.map(ctx => client.join(this.contextRoom(ctx))));
        client.data.trasladoContextos = contexts;
        return { ok: true };
      })
      .catch(() => {
        client.disconnect(true);
        return { ok: false };
      });
    this.roomOperations.set(client, operation);
    return operation;
  }

  public publish(
    event: Omit<TrasladoRealtimeEvent, 'ocurridoEn'>,
    documentos: string[] = []
  ): void {
    const payload: TrasladoRealtimeEvent = { ...event, ocurridoEn: new Date().toISOString() };
    this.server.to(this.contextRoom(payload.contextoCode)).emit('traslado.actualizado', payload);
    const rooms = [
      ...new Set(documentos.filter(Boolean).map(documento => this.userRoom(documento))),
    ];
    if (rooms.length) this.server.to(rooms).emit('traslado.personal-actualizado', payload);
  }

  private getToken(value: unknown): string {
    const token = String(value || '')
      .replace(/^Bearer\s+/i, '')
      .trim();
    if (!token) throw new Error('Token requerido');
    return token;
  }

  private contextRoom(contextoCode: GcmContextCode): string {
    return `traslado:contexto:${contextoCode}`;
  }

  private userRoom(documento: string): string {
    return `traslado:usuario:${documento.trim()}`;
  }
}
