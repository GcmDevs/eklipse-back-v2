import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
@WebSocketGateway({ namespace: '/v1/hpn/seguimiento-quirurgico/eventos', cors: { origin: true } })
export class SeguimientoQuirurgicoGateway {
  @WebSocketServer() server: Server;
  publicar(cirugiaId: string) { this.server.emit('cirugia-actualizada', { tipo: 'CIRUGIA_ACTUALIZADA', cirugiaId }); }
}
