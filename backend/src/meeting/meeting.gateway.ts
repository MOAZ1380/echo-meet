import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway(8000, {
  cors: { origin: '*' },
})
/**
 * Realtime gateway for room join workflow and live meeting presence.
 */
export class MeetingGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomService: RoomService) {}

  /**
   * Runs once after gateway initialization.
   */
  onModuleInit() {
    console.log('[Socket] Gateway ready on :8000');
  }

  /**
   * Handles a newly connected socket.
   *
   * If userId is available in handshake query, the socket joins a private
   * user room (named with userId) for targeted realtime notifications.
   *
   * @param client Current socket client.
   */
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      client.join(userId);
    }
  }

  /**
   * Handles socket disconnect event.
   *
   * @param client Current socket client.
   */
  handleDisconnect(client: Socket) {
    console.log(`[Socket] Disconnected: ${client.id}`);
  }

  /**
   * Event: requestJoin
   *
   * Creates a pending join request, then notifies room owner in realtime.
   * Emits room:join-request to the owner private room.
   *
   * @param data Room id and requester user id.
   * @returns Success flag.
   */
  @SubscribeMessage('requestJoinAuth')
  async requesrequestJoinAuthtJoin(
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    const participant = await this.roomService.requestJoin(
      data.roomId,
      data.userId,
    );

    const room = await this.roomService.findOne(data.roomId);

    this.server.to(room.ownerId).emit('room:join-request', {
      roomId: data.roomId,
      userId: data.userId,
      participant,
    });

    return { success: true };
  }

  /**
   * Event: requestJoin
   *
   * Creates a pending join request, then notifies room owner in realtime.
   * Emits room:join-request to the owner private room.
   *
   * @param data Room id and requester user id.
   * @returns Success flag.
   */
  @SubscribeMessage('requestJoinGuest')
  async requestJoinGuest(
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    const participant = await this.roomService.requestJoin(
      data.roomId,
      data.userId,
    );

    const room = await this.roomService.findOne(data.roomId);

    this.server.to(room.ownerId).emit('room:join-request', {
      roomId: data.roomId,
      userId: data.userId,
      participant,
    });

    return { success: true };
  }

  /**
   * Event: approveUser
   *
   * Approves a join request and notifies the approved user.
   * Emits room:approved to the approved user's private room.
   *
   * @param data Room id, target user id, and owner id.
   * @returns Success flag.
   */
  @SubscribeMessage('approveUser')
  async approveUser(
    @MessageBody() data: { roomId: string; userId: string; ownerId: string },
  ) {
    await this.roomService.approveUser(data.roomId, data.userId, data.ownerId);

    this.server.to(data.userId).emit('room:approved', {
      roomId: data.roomId,
    });

    return { success: true };
  }

  /**
   * Event: rejectUser
   *
   * Rejects a join request and notifies the rejected user.
   * Emits room:rejected to the rejected user's private room.
   *
   * @param data Room id, target user id, and owner id.
   * @returns Success flag.
   */
  @SubscribeMessage('rejectUser')
  async rejectUser(
    @MessageBody() data: { roomId: string; userId: string; ownerId: string },
  ) {
    await this.roomService.rejectUser(data.roomId, data.userId, data.ownerId);

    this.server.to(data.userId).emit('room:rejected', {
      roomId: data.roomId,
    });

    return { success: true };
  }

  /**
   * Event: joinRoom
   *
   * Adds socket to room channel and announces presence to room members.
   * Emits userJoined to the room after successful join.
   *
   * @param data Room id and joining user id.
   * @param client Current socket client.
   * @returns Success flag or error event emission when room is missing.
   */
  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomService.findOne(data.roomId);

    if (!room) {
      return client.emit('error', { message: 'Room not found' });
    }

    client.join(room.id);

    this.server.to(room.id).emit('userJoined', {
      userId: data.userId,
    });

    return { success: true };
  }
}
