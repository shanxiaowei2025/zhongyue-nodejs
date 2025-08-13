import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userIdToSocketIds = new Map<number, Set<string>>();
  private readonly socketIdToUserId = new Map<string, number>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth && (client.handshake.auth as any).token) || (client.handshake.query && (client.handshake.query as any).token);
      if (!token) {
        this.logger.warn('连接缺少token，断开');
        client.disconnect(true);
        return;
      }
      const payload: any = this.jwtService.verify(String(token));
      const userId = Number(payload.sub);
      if (!userId) {
        this.logger.warn('无效用户，断开');
        client.disconnect(true);
        return;
      }
      this.bindSocket(userId, client.id);
      this.logger.log(`用户${userId}已连接，socket=${client.id}`);
    } catch (e) {
      this.logger.warn(`token验证失败: ${e?.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketIdToUserId.get(client.id);
    if (userId) {
      const set = this.userIdToSocketIds.get(userId);
      if (set) {
        set.delete(client.id);
        if (set.size === 0) {
          this.userIdToSocketIds.delete(userId);
        }
      }
      this.socketIdToUserId.delete(client.id);
      this.logger.log(`用户${userId}断开，socket=${client.id}`);
    }
  }

  private bindSocket(userId: number, socketId: string) {
    if (!this.userIdToSocketIds.has(userId)) {
      this.userIdToSocketIds.set(userId, new Set());
    }
    this.userIdToSocketIds.get(userId)!.add(socketId);
    this.socketIdToUserId.set(socketId, userId);
  }

  pushToUsers(userIds: number[], event: string, payload: any) {
    for (const userId of userIds) {
      const set = this.userIdToSocketIds.get(userId);
      if (!set) continue;
      for (const sid of set) {
        this.server.to(sid).emit(event, payload);
      }
    }
  }
} 