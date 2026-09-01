import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { processEnv } from '@env';
import { JWTServices } from '@common/application/services';
import { VALID_HOSTS } from '@hpn/app.environments';
import { GcmContextCode } from '@common/domain/types';

export type TrasladoRealtimeEventType =
  | 'CREACION'
  | 'DECISION'
  | 'ASIGNACION'
  | 'REASIGNACION'
  | 'ENTREGA'
  | 'RECEPCION'
  | 'INICIO'
  | 'RETORNO'
  | 'MONITOREO'
  | 'INCIDENTE'
  | 'FINALIZACION'
  | 'CANCELACION';

export interface TrasladoRealtimeEvent {
  tipo: TrasladoRealtimeEventType;
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

  public handleConnection(client: Socket): void {
    try {
      const token = this.getToken(client.handshake.auth?.token);
      if (processEnv.PRODUCTION) jwt.verify(token, processEnv.JWT_SECRET_KEY);

      const auth = JWTServices.decodeToken(token);
      client.data.documento = auth.user.document;
      client.data.contextoCode = auth.context.getCode();
      client.join(this.userRoom(auth.user.document));
    } catch (error: any) {
      this.logger.warn(`Conexión de traslados rechazada: ${error.message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('traslado:suscribir-contexto')
  public subscribeContext(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { contextoCode: GcmContextCode }
  ): void {
    if (!client.data.documento || !body?.contextoCode) return;

    [...client.rooms]
      .filter(room => room.startsWith('traslado:contexto:'))
      .forEach(room => client.leave(room));

    client.join(this.contextRoom(body.contextoCode));
  }

  public publish(
    event: Omit<TrasladoRealtimeEvent, 'ocurridoEn'>,
    documentos: string[] = []
  ): void {
    const payload: TrasladoRealtimeEvent = { ...event, ocurridoEn: new Date().toISOString() };
    const rooms = [
      this.contextRoom(payload.contextoCode),
      ...[...new Set(documentos.filter(Boolean))].map(documento => this.userRoom(documento)),
    ];
    this.server.to(rooms).emit('traslado.actualizado', payload);
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
